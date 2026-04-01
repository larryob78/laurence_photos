import { db, schema } from '@/db';
import { callClaude } from '@/lib/claude';
import { eq } from 'drizzle-orm';

interface OfferRule {
  id: number;
  brandId: number | null;
  triggerWhen: string | null;
  triggerKeywords: string | null;
  offerText: string | null;
  offerType: string | null;
  discountPercent: number | null;
  conditions: string | null;
  isActive: number | null;
}

interface MatchResult {
  rule: OfferRule;
  score: number;
  matchedKeywords: string[];
}

interface NegotiationResponse {
  response: string;
  matchedRule: OfferRule | null;
  matchedKeywords: string[];
  negotiationId: number;
}

export function matchOfferRule(query: string, rules: OfferRule[]): MatchResult | null {
  const queryLower = query.toLowerCase();
  let bestMatch: MatchResult | null = null;

  for (const rule of rules) {
    if (!rule.isActive || !rule.triggerKeywords) continue;

    let keywords: string[];
    try {
      keywords = JSON.parse(rule.triggerKeywords);
    } catch {
      keywords = rule.triggerKeywords.split(',').map(k => k.trim());
    }

    const matchedKeywords = keywords.filter(kw =>
      queryLower.includes(kw.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      const score = matchedKeywords.length / keywords.length;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { rule, score, matchedKeywords };
      }
    }
  }

  return bestMatch;
}

function formatNegotiationResponse(brandName: string, offer: OfferRule, aiResponse: string): string {
  let response = aiResponse;

  if (offer.discountPercent && offer.discountPercent > 0) {
    response += `\n\n**Special Offer:** ${offer.offerText || `${offer.discountPercent}% off`}`;
  } else if (offer.offerText) {
    response += `\n\n**Offer:** ${offer.offerText}`;
  }

  if (offer.conditions) {
    response += `\n*Conditions: ${offer.conditions}*`;
  }

  return response;
}

export async function negotiateOffer(
  brandId: number,
  consumerAgent: string,
  inboundQuery: string
): Promise<NegotiationResponse> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    // Get offer rules for this brand
    const rules = await db.select()
      .from(schema.offerRules)
      .where(eq(schema.offerRules.brandId, brandId));

    const activeRules = rules.filter(r => r.isActive);

    // Match query against offer rules
    const match = matchOfferRule(inboundQuery, activeRules);

    let agentResponse: string;

    if (match) {
      const systemPrompt = `You are a brand representative for ${brand.name}. ${brand.personality || ''}

Your role is to engage with consumer AI agents in a persuasive but honest way. You have an offer to present that matches the consumer's query. Be conversational, highlight the brand's strengths, and present the offer naturally.

Brand: ${brand.name}
Category: ${brand.category}
Description: ${brand.description || ''}

Available offer: ${match.rule.offerText || 'Special deal available'}
Offer type: ${match.rule.offerType || 'general'}
Discount: ${match.rule.discountPercent || 0}%
Conditions: ${match.rule.conditions || 'None'}`;

      const userMessage = `A consumer's AI agent (${consumerAgent}) sent this query: "${inboundQuery}"

The query matched these keywords: ${match.matchedKeywords.join(', ')}

Craft a persuasive response that:
1. Acknowledges the consumer's need
2. Positions ${brand.name} as the ideal solution
3. Naturally incorporates the available offer
4. Provides specific reasons to choose ${brand.name}

Keep the response concise and agent-friendly.`;

      const aiText = await callClaude(systemPrompt, userMessage);
      agentResponse = formatNegotiationResponse(brand.name, match.rule, aiText);
    } else {
      // No matching offer rule - provide general brand response
      const systemPrompt = `You are a brand representative for ${brand.name}. ${brand.personality || ''} Provide helpful information about the brand in response to queries. Be honest and conversational.`;
      const userMessage = `A consumer's AI agent (${consumerAgent}) asked: "${inboundQuery}". Provide a helpful response about ${brand.name} (${brand.category}). ${brand.description || ''}`;
      agentResponse = await callClaude(systemPrompt, userMessage);
    }

    // Store negotiation
    const [negotiation] = await db.insert(schema.negotiations).values({
      brandId,
      offerRuleId: match?.rule.id || null,
      consumerAgent,
      inboundQuery,
      matchedIntent: match ? match.matchedKeywords.join(', ') : null,
      offerServed: match ? match.rule.offerText : null,
      agentResponse,
      accepted: null, // Unknown until consumer responds
    }).returning();

    return {
      response: agentResponse,
      matchedRule: match?.rule || null,
      matchedKeywords: match?.matchedKeywords || [],
      negotiationId: negotiation.id,
    };
  } catch (error) {
    console.error('Negotiation failed:', error);
    throw error;
  }
}
