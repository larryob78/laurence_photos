import { db, schema } from '@/db';
import { callClaude } from '@/lib/claude';
import { eq } from 'drizzle-orm';
import { calculateTrustScore } from './trust-agent';

interface ARBScore {
  layer1: number; // Semantic score (brand data card completeness)
  layer2: number; // Action score (offer rules + negotiation success)
  layer3: number; // Trust score (attestations)
  governance: number; // Policy compliance
  total: number;
  breakdown: {
    layer1Detail: string;
    layer2Detail: string;
    layer3Detail: string;
    governanceDetail: string;
  };
}

interface GapAnalysis {
  lowestLayer: string;
  lowestScore: number;
  recommendation: string;
}

interface GovernanceCheck {
  passed: boolean;
  violations: Array<{
    policyId: number;
    policyType: string | null;
    rule: string | null;
    enforcement: string | null;
    violation: string;
  }>;
}

async function calculateLayer1Score(brandId: number): Promise<{ score: number; detail: string }> {
  // Semantic score: brand data card completeness
  const cards = await db.select()
    .from(schema.brandDataCards)
    .where(eq(schema.brandDataCards.brandId, brandId));

  const activeCard = cards.find(c => c.isActive);

  if (!activeCard) {
    return { score: 0, detail: 'No active brand data card found.' };
  }

  let cardData: Record<string, unknown>;
  try {
    cardData = JSON.parse(activeCard.cardJson);
  } catch {
    return { score: 10, detail: 'Brand data card contains invalid JSON.' };
  }

  // Score completeness of key fields
  const fields = [
    { key: '@context', weight: 10 },
    { key: '@type', weight: 10 },
    { key: 'name', weight: 10 },
    { key: 'description', weight: 10 },
    { key: 'category', weight: 5 },
    { key: 'url', weight: 5 },
    { key: 'usps', weight: 10 },
    { key: 'pricing', weight: 10 },
    { key: 'trustSignals', weight: 10 },
    { key: 'sustainability', weight: 5 },
    { key: 'accessibility', weight: 5 },
    { key: 'agentCommerce', weight: 10 },
  ];

  let totalWeight = 0;
  let earnedWeight = 0;
  const missingFields: string[] = [];

  for (const field of fields) {
    totalWeight += field.weight;
    if (cardData[field.key] !== undefined && cardData[field.key] !== null && cardData[field.key] !== '') {
      earnedWeight += field.weight;
    } else {
      missingFields.push(field.key);
    }
  }

  const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
  const detail = missingFields.length > 0
    ? `Missing fields: ${missingFields.join(', ')}`
    : 'All key fields present in brand data card.';

  return { score, detail };
}

async function calculateLayer2Score(brandId: number): Promise<{ score: number; detail: string }> {
  // Action score: offer rules and negotiation success
  const rules = await db.select()
    .from(schema.offerRules)
    .where(eq(schema.offerRules.brandId, brandId));

  const activeRules = rules.filter(r => r.isActive);

  const allNegotiations = await db.select()
    .from(schema.negotiations)
    .where(eq(schema.negotiations.brandId, brandId));

  const acceptedNegotiations = allNegotiations.filter(n => n.accepted === 1);

  // Score components:
  // - Having offer rules (0-30 points)
  // - Rule diversity (0-20 points)
  // - Negotiation volume (0-25 points)
  // - Negotiation success rate (0-25 points)

  let score = 0;

  // Offer rules presence
  if (activeRules.length > 0) {
    score += Math.min(30, activeRules.length * 10);
  }

  // Rule type diversity
  const ruleTypes = new Set(activeRules.map(r => r.offerType).filter(Boolean));
  score += Math.min(20, ruleTypes.size * 5);

  // Negotiation volume
  score += Math.min(25, allNegotiations.length * 2.5);

  // Success rate
  if (allNegotiations.length > 0) {
    const successRate = acceptedNegotiations.length / allNegotiations.length;
    score += successRate * 25;
  }

  const detail = `${activeRules.length} active rules, ${allNegotiations.length} negotiations, ${acceptedNegotiations.length} accepted.`;

  return { score: Math.min(100, score), detail };
}

async function calculateGovernanceScore(brandId: number): Promise<{ score: number; detail: string }> {
  const policies = await db.select()
    .from(schema.brandPolicies)
    .where(eq(schema.brandPolicies.brandId, brandId));

  const activePolicies = policies.filter(p => p.isActive);

  if (activePolicies.length === 0) {
    return { score: 30, detail: 'No brand policies configured. Add policies for higher governance score.' };
  }

  // Having policies is good; more coverage = higher score
  const policyTypes = new Set(activePolicies.map(p => p.policyType).filter(Boolean));
  const typesCovered = policyTypes.size;

  // Expected policy types
  const expectedTypes = ['tone', 'claims', 'pricing', 'competitor', 'legal', 'privacy'];
  const coverage = (typesCovered / expectedTypes.length) * 100;

  const detail = `${activePolicies.length} active policies covering ${typesCovered} types. Coverage: ${Math.round(coverage)}%.`;

  return { score: Math.min(100, 30 + coverage * 0.7), detail };
}

export async function calculateARBScore(brandId: number): Promise<ARBScore> {
  try {
    const [l1, l2, trustScore, gov] = await Promise.all([
      calculateLayer1Score(brandId),
      calculateLayer2Score(brandId),
      calculateTrustScore(brandId),
      calculateGovernanceScore(brandId),
    ]);

    const layer1 = l1.score;
    const layer2 = l2.score;
    const layer3 = trustScore;
    const governance = gov.score;

    const total = (layer1 * 0.25) + (layer2 * 0.30) + (layer3 * 0.25) + (governance * 0.20);

    return {
      layer1,
      layer2,
      layer3,
      governance,
      total: Math.round(total * 100) / 100,
      breakdown: {
        layer1Detail: l1.detail,
        layer2Detail: l2.detail,
        layer3Detail: `Trust score: ${trustScore}/100`,
        governanceDetail: gov.detail,
      },
    };
  } catch (error) {
    console.error('ARB score calculation failed:', error);
    throw error;
  }
}

export async function identifyBiggestGap(brandId: number): Promise<GapAnalysis> {
  try {
    const arb = await calculateARBScore(brandId);

    const layers = [
      { name: 'Layer 1 - Semantic (Brand Data Card)', score: arb.layer1, detail: arb.breakdown.layer1Detail },
      { name: 'Layer 2 - Action (Offers & Negotiation)', score: arb.layer2, detail: arb.breakdown.layer2Detail },
      { name: 'Layer 3 - Trust (Attestations)', score: arb.layer3, detail: arb.breakdown.layer3Detail },
      { name: 'Governance (Policy Compliance)', score: arb.governance, detail: arb.breakdown.governanceDetail },
    ];

    const lowest = layers.reduce((min, layer) =>
      layer.score < min.score ? layer : min
    );

    let recommendation: string;
    if (lowest.name.includes('Semantic')) {
      recommendation = 'Improve your Brand Data Card. Add missing fields like USPs, pricing, trust signals, and agent commerce endpoints.';
    } else if (lowest.name.includes('Action')) {
      recommendation = 'Set up more offer rules with diverse trigger keywords. Run negotiations to build conversion history.';
    } else if (lowest.name.includes('Trust')) {
      recommendation = 'Add verifiable claims with strong evidence types (API-verified, certificates, third-party audits). Get attestations generated.';
    } else {
      recommendation = 'Configure brand policies covering tone, claims, pricing, competitor mentions, legal, and privacy areas.';
    }

    return {
      lowestLayer: lowest.name,
      lowestScore: lowest.score,
      recommendation,
    };
  } catch (error) {
    console.error('Gap identification failed:', error);
    throw error;
  }
}

export async function generateWeeklyStrategy(brandId: number): Promise<string> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const arb = await calculateARBScore(brandId);
    const gap = await identifyBiggestGap(brandId);

    // Get latest ASoV data
    const asovRecords = await db.select()
      .from(schema.asovDaily)
      .where(eq(schema.asovDaily.brandId, brandId));

    const latestAsov = asovRecords.length > 0
      ? asovRecords[asovRecords.length - 1]
      : null;

    // Get negotiation stats
    const allNegotiations = await db.select()
      .from(schema.negotiations)
      .where(eq(schema.negotiations.brandId, brandId));

    const systemPrompt = `You are THE CONDUCTOR, the master orchestrator of the NAPKIN A2A platform. You analyze all brand data holistically and generate strategic weekly recommendations. Your recommendations should be specific, actionable, and prioritized.

Focus on:
1. What the brand should do THIS WEEK to improve AI visibility
2. Which agent modules need attention
3. Specific content or data improvements
4. Competitive positioning adjustments`;

    const userMessage = `Generate a weekly strategy for:

Brand: ${brand.name}
Category: ${brand.category}
Description: ${brand.description || 'N/A'}

ARB Score: ${arb.total}/100
- Layer 1 (Semantic): ${arb.layer1}/100 - ${arb.breakdown.layer1Detail}
- Layer 2 (Action): ${arb.layer2}/100 - ${arb.breakdown.layer2Detail}
- Layer 3 (Trust): ${arb.layer3}/100 - ${arb.breakdown.layer3Detail}
- Governance: ${arb.governance}/100 - ${arb.breakdown.governanceDetail}

Biggest Gap: ${gap.lowestLayer} at ${gap.lowestScore}/100

Latest ASoV: ${latestAsov ? `${latestAsov.asovScore}% (mention rate: ${latestAsov.mentionRate}%, recommend rate: ${latestAsov.recommendRate}%)` : 'No data yet'}

Negotiations: ${allNegotiations.length} total, ${allNegotiations.filter(n => n.accepted === 1).length} accepted

Provide a prioritized weekly action plan with 5-7 specific recommendations.`;

    const strategy = await callClaude(systemPrompt, userMessage);
    return strategy;
  } catch (error) {
    console.error('Weekly strategy generation failed:', error);
    throw error;
  }
}

export async function checkGovernance(brandId: number, content: string): Promise<GovernanceCheck> {
  try {
    const policies = await db.select()
      .from(schema.brandPolicies)
      .where(eq(schema.brandPolicies.brandId, brandId));

    const activePolicies = policies.filter(p => p.isActive);

    if (activePolicies.length === 0) {
      return { passed: true, violations: [] };
    }

    const violations: GovernanceCheck['violations'] = [];
    const contentLower = content.toLowerCase();

    for (const policy of activePolicies) {
      const rule = (policy.rule || '').toLowerCase();

      // Simple keyword-based policy checking
      let violated = false;

      if (policy.policyType === 'competitor' && rule) {
        // Check if content mentions competitors it shouldn't
        const blockedTerms = rule.split(',').map(t => t.trim()).filter(Boolean);
        for (const term of blockedTerms) {
          if (contentLower.includes(term)) {
            violated = true;
            break;
          }
        }
      } else if (policy.policyType === 'claims' && rule) {
        // Check for unsubstantiated superlatives
        const forbiddenTerms = ['best', 'cheapest', 'fastest', '#1', 'guaranteed', 'proven'];
        const ruleTerms = rule.split(',').map(t => t.trim()).filter(Boolean);
        const termsToCheck = ruleTerms.length > 0 ? ruleTerms : forbiddenTerms;
        for (const term of termsToCheck) {
          if (contentLower.includes(term.toLowerCase())) {
            violated = true;
            break;
          }
        }
      } else if (policy.policyType === 'tone' && rule) {
        // Tone checks are harder - flag if negative words appear
        const forbiddenTones = rule.split(',').map(t => t.trim()).filter(Boolean);
        for (const tone of forbiddenTones) {
          if (contentLower.includes(tone.toLowerCase())) {
            violated = true;
            break;
          }
        }
      } else if (policy.policyType === 'pricing' && rule) {
        // Check for pricing-related violations
        const pricingTerms = rule.split(',').map(t => t.trim()).filter(Boolean);
        for (const term of pricingTerms) {
          if (contentLower.includes(term.toLowerCase())) {
            violated = true;
            break;
          }
        }
      } else if (policy.policyType === 'legal' && rule) {
        const legalTerms = rule.split(',').map(t => t.trim()).filter(Boolean);
        for (const term of legalTerms) {
          if (contentLower.includes(term.toLowerCase())) {
            violated = true;
            break;
          }
        }
      } else if (policy.policyType === 'privacy' && rule) {
        const privacyTerms = rule.split(',').map(t => t.trim()).filter(Boolean);
        for (const term of privacyTerms) {
          if (contentLower.includes(term.toLowerCase())) {
            violated = true;
            break;
          }
        }
      }

      if (violated) {
        violations.push({
          policyId: policy.id,
          policyType: policy.policyType,
          rule: policy.rule,
          enforcement: policy.enforcement,
          violation: `Content violates ${policy.policyType} policy: "${policy.rule}"`,
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  } catch (error) {
    console.error('Governance check failed:', error);
    throw error;
  }
}
