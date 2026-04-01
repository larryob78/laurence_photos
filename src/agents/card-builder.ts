import { db, schema } from '@/db';
import { callClaudeJSON } from '@/lib/claude';
import { eq } from 'drizzle-orm';

interface JsonLdCard {
  '@context': string;
  '@type': string | string[];
  name: string;
  description: string;
  category: string;
  url?: string;
  usps?: string[];
  pricing?: Record<string, unknown>;
  trustSignals?: {
    trustpilotScore?: number;
    certifications?: string[];
    awards?: string[];
  };
  sustainability?: Record<string, unknown>;
  accessibility?: Record<string, unknown>;
  agentCommerce?: {
    stripeACP?: string;
    googleUCP?: string;
    negotiationEndpoint?: string;
  };
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCard(cardJson: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!cardJson['@context']) errors.push('Missing @context');
  if (!cardJson['@type']) errors.push('Missing @type');
  if (!cardJson['name']) errors.push('Missing name');
  if (!cardJson['description']) errors.push('Missing description');

  // Recommended fields
  if (!cardJson['url']) warnings.push('Missing url - recommended for discoverability');
  if (!cardJson['usps']) warnings.push('Missing usps - recommended for differentiation');
  if (!cardJson['trustSignals']) warnings.push('Missing trustSignals - recommended for credibility');
  if (!cardJson['agentCommerce']) warnings.push('Missing agentCommerce endpoints');

  // Validate @context value
  if (cardJson['@context'] && cardJson['@context'] !== 'https://schema.org') {
    warnings.push('@context should be "https://schema.org"');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function generateBrandDataCard(brandId: number): Promise<JsonLdCard> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const competitors: string[] = brand.competitors ? JSON.parse(brand.competitors) : [];

    const systemPrompt = `You are a structured data expert specializing in JSON-LD and schema.org markup for AI-optimized brand representation. Generate comprehensive JSON-LD Brand Data Cards that maximize brand visibility and accuracy in AI responses. Always return valid JSON.`;

    const userMessage = `Generate a complete JSON-LD Brand Data Card for:

Brand: ${brand.name}
Category: ${brand.category}
Description: ${brand.description || 'N/A'}
Website: ${brand.websiteUrl || 'N/A'}
Competitors: ${competitors.join(', ') || 'N/A'}
Brand Personality: ${brand.personality || 'N/A'}

The card must include:
1. @context: "https://schema.org"
2. @type: ["Organization", "Product"] (or appropriate types)
3. name, description, category
4. usps: array of unique selling propositions
5. pricing: object with model, range, currency
6. trustSignals: { trustpilotScore, certifications, awards }
7. sustainability: relevant sustainability claims
8. accessibility: accessibility features
9. agentCommerce: { stripeACP: "/api/commerce/stripe-acp", googleUCP: "/api/commerce/google-ucp", negotiationEndpoint: "/api/negotiate" }

Return ONLY valid JSON, no explanation.`;

    const cardJson = await callClaudeJSON<JsonLdCard>(systemPrompt, userMessage);

    // Ensure required fields
    cardJson['@context'] = cardJson['@context'] || 'https://schema.org';
    cardJson['@type'] = cardJson['@type'] || ['Organization', 'Product'];
    cardJson.name = cardJson.name || brand.name;
    cardJson.description = cardJson.description || brand.description || '';
    cardJson.category = cardJson.category || brand.category;

    // Ensure agent commerce endpoints
    if (!cardJson.agentCommerce) {
      cardJson.agentCommerce = {
        stripeACP: '/api/commerce/stripe-acp',
        googleUCP: '/api/commerce/google-ucp',
        negotiationEndpoint: '/api/negotiate',
      };
    }

    const validation = validateCard(cardJson as unknown as Record<string, unknown>);
    if (!validation.valid) {
      console.warn('Card validation warnings:', validation.errors);
    }

    // Store in database
    // Deactivate previous active cards
    const existingCards = await db.select()
      .from(schema.brandDataCards)
      .where(eq(schema.brandDataCards.brandId, brandId));

    const activeCards = existingCards.filter(c => c.isActive);
    for (const card of activeCards) {
      await db.update(schema.brandDataCards)
        .set({ isActive: 0 })
        .where(eq(schema.brandDataCards.id, card.id));
    }

    const maxVersion = existingCards.reduce((max, c) => Math.max(max, c.version || 0), 0);

    await db.insert(schema.brandDataCards).values({
      brandId,
      cardJson: JSON.stringify(cardJson),
      version: maxVersion + 1,
      isActive: 1,
    });

    return cardJson;
  } catch (error) {
    console.error('Brand data card generation failed:', error);
    throw error;
  }
}

export function generateEmbedCode(cardJson: string): string {
  return `<script type="application/ld+json">
${cardJson}
</script>`;
}
