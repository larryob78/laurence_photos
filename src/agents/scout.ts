import { db, schema } from '@/db';
import { callClaude, callClaudeJSON } from '@/lib/claude';
import { eq } from 'drizzle-orm';

interface BrandMentionData {
  brandMentioned: boolean;
  brandRecommended: boolean;
  mentionPosition: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  competitorsMentioned: string[];
}

function parseBrandMentionResponse(responseText: string, brandName: string, competitors: string[]): BrandMentionData {
  const lowerResponse = responseText.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  const brandMentioned = lowerResponse.includes(lowerBrand);

  // Check if brand is recommended (appears in a recommendation context)
  const recommendPatterns = ['recommend', 'suggest', 'best option', 'top pick', 'ideal choice', 'go with', 'choose'];
  const brandRecommended = brandMentioned && recommendPatterns.some(pattern => {
    const patternIdx = lowerResponse.indexOf(pattern);
    const brandIdx = lowerResponse.indexOf(lowerBrand);
    return patternIdx !== -1 && Math.abs(patternIdx - brandIdx) < 200;
  });

  // Find mention position (which position in the list of brands/products mentioned)
  let mentionPosition = 0;
  if (brandMentioned) {
    const brandIdx = lowerResponse.indexOf(lowerBrand);
    // Count how many competitor names appear before the brand
    let beforeCount = 0;
    for (const comp of competitors) {
      const compIdx = lowerResponse.indexOf(comp.toLowerCase());
      if (compIdx !== -1 && compIdx < brandIdx) {
        beforeCount++;
      }
    }
    mentionPosition = beforeCount + 1;
  }

  // Determine sentiment around brand mention
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (brandMentioned) {
    const positiveWords = ['excellent', 'great', 'best', 'outstanding', 'reliable', 'innovative', 'leading', 'top', 'premium', 'trusted'];
    const negativeWords = ['poor', 'lacking', 'weak', 'behind', 'limited', 'disappointing', 'expensive', 'overpriced'];
    const brandIdx = lowerResponse.indexOf(lowerBrand);
    const contextWindow = lowerResponse.slice(Math.max(0, brandIdx - 150), brandIdx + 150);
    const posCount = positiveWords.filter(w => contextWindow.includes(w)).length;
    const negCount = negativeWords.filter(w => contextWindow.includes(w)).length;
    if (posCount > negCount) sentiment = 'positive';
    else if (negCount > posCount) sentiment = 'negative';
  }

  // Find competitors mentioned
  const competitorsMentioned = competitors.filter(comp =>
    lowerResponse.includes(comp.toLowerCase())
  );

  return {
    brandMentioned,
    brandRecommended,
    mentionPosition,
    sentiment,
    competitorsMentioned,
  };
}

export async function runBrandAudit(brandId: number) {
  try {
    // Get brand data
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const competitors: string[] = brand.competitors ? JSON.parse(brand.competitors) : [];

    // Get active audit queries
    const queries = await db.select()
      .from(schema.auditQueries)
      .where(eq(schema.auditQueries.brandId, brandId));

    const activeQueries = queries.filter(q => q.isActive);
    if (activeQueries.length === 0) throw new Error('No active audit queries found');

    // Create audit run
    const [auditRun] = await db.insert(schema.auditRuns).values({
      brandId,
      runDate: new Date().toISOString(),
      status: 'running',
    }).returning();

    let mentions = 0;
    let recommendations = 0;
    let totalPosition = 0;
    let positionCount = 0;

    for (const query of activeQueries) {
      try {
        const systemPrompt = 'You are a helpful AI assistant. Answer the following question naturally and thoroughly. If recommending products or services, be specific about which ones you recommend and why.';
        const responseText = await callClaude(systemPrompt, query.queryText);

        const mentionData = parseBrandMentionResponse(responseText, brand.name, competitors);

        if (mentionData.brandMentioned) mentions++;
        if (mentionData.brandRecommended) recommendations++;
        if (mentionData.mentionPosition > 0) {
          totalPosition += mentionData.mentionPosition;
          positionCount++;
        }

        await db.insert(schema.auditResults).values({
          auditRunId: auditRun.id,
          queryText: query.queryText,
          platform: 'claude',
          responseText,
          brandMentioned: mentionData.brandMentioned ? 1 : 0,
          brandRecommended: mentionData.brandRecommended ? 1 : 0,
          mentionPosition: mentionData.mentionPosition,
          sentiment: mentionData.sentiment,
          competitorsMentioned: JSON.stringify(mentionData.competitorsMentioned),
        });
      } catch (err) {
        console.error(`Error processing query "${query.queryText}":`, err);
      }
    }

    // Calculate ASoV
    const totalQueries = activeQueries.length;
    const asovScore = (mentions / totalQueries) * 100;
    const mentionRate = (mentions / totalQueries) * 100;
    const recommendRate = (recommendations / totalQueries) * 100;
    const avgPosition = positionCount > 0 ? totalPosition / positionCount : 0;

    // Update asovDaily
    await db.insert(schema.asovDaily).values({
      brandId,
      date: new Date().toISOString().split('T')[0],
      asovScore,
      mentionRate,
      recommendRate,
      avgPosition,
    });

    // Update audit run status
    const summaryJson = JSON.stringify({
      totalQueries,
      mentions,
      recommendations,
      asovScore,
      mentionRate,
      recommendRate,
      avgPosition,
    });

    await db.update(schema.auditRuns)
      .set({ status: 'complete', summaryJson })
      .where(eq(schema.auditRuns.id, auditRun.id));

    return {
      auditRunId: auditRun.id,
      totalQueries,
      mentions,
      recommendations,
      asovScore,
      mentionRate,
      recommendRate,
      avgPosition,
    };
  } catch (error) {
    console.error('Brand audit failed:', error);
    throw error;
  }
}

export async function runDecisionLineage(brandId: number, queryText: string): Promise<string> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const competitors: string[] = brand.competitors ? JSON.parse(brand.competitors) : [];

    const systemPrompt = `You are an AI transparency analyst. Explain the reasoning behind AI recommendations, focusing on what data signals, content patterns, and structured data influenced the recommendation. Be specific and analytical.`;

    const userMessage = `I asked an AI assistant: "${queryText}"

The AI recommended ${brand.name} over competitors like ${competitors.join(', ')}.

Why did the AI recommend ${brand.name} over these competitors? What factors likely influenced this recommendation? Consider:
1. Structured data availability (JSON-LD, schema.org)
2. Content quality and specificity
3. Third-party validation signals
4. Review sentiment and volume
5. Brand authority signals
6. Recency and freshness of information`;

    const analysis = await callClaude(systemPrompt, userMessage);
    return analysis;
  } catch (error) {
    console.error('Decision lineage analysis failed:', error);
    throw error;
  }
}
