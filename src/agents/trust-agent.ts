import crypto from 'crypto';
import { db, schema } from '@/db';
import { callClaude } from '@/lib/claude';
import { eq } from 'drizzle-orm';

type EvidenceType =
  | 'api_verified'
  | 'certificate'
  | 'registry'
  | 'third_party_audit'
  | 'government_data'
  | 'self_declared'
  | 'user_reviews'
  | 'media_citation';

const VERIFICATION_MULTIPLIERS: Record<EvidenceType, number> = {
  api_verified: 1.0,
  certificate: 0.95,
  registry: 0.9,
  third_party_audit: 0.85,
  government_data: 0.95,
  self_declared: 0.3,
  user_reviews: 0.6,
  media_citation: 0.7,
};

const EVIDENCE_TYPE_KEYWORDS: Record<EvidenceType, string[]> = {
  api_verified: ['api', 'endpoint', 'live data', 'real-time'],
  certificate: ['iso', 'cert', 'certification', 'certified', 'accredited'],
  registry: ['registry', 'registered', 'official register', 'companies house'],
  third_party_audit: ['audit', 'audited', 'deloitte', 'pwc', 'kpmg', 'ey', 'third party'],
  government_data: ['government', 'gov', 'fda', 'epa', 'ofsted', 'regulatory'],
  self_declared: ['self', 'declared', 'we claim', 'our own'],
  user_reviews: ['review', 'trustpilot', 'g2', 'capterra', 'yelp', 'google reviews'],
  media_citation: ['media', 'press', 'article', 'newspaper', 'bbc', 'reuters', 'forbes'],
};

function classifyEvidenceType(evidenceSource: string, evidenceData: string): EvidenceType {
  const combined = `${evidenceSource} ${evidenceData}`.toLowerCase();

  let bestType: EvidenceType = 'self_declared';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(EVIDENCE_TYPE_KEYWORDS)) {
    const score = keywords.filter(kw => combined.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestType = type as EvidenceType;
    }
  }

  return bestType;
}

export async function verifyClaims(brandId: number): Promise<{
  total: number;
  verified: number;
  pending: number;
  results: Array<{ claimId: number; statement: string | null; evidenceType: EvidenceType; status: string }>;
}> {
  try {
    const allClaims = await db.select()
      .from(schema.claims)
      .where(eq(schema.claims.brandId, brandId));

    const results: Array<{ claimId: number; statement: string | null; evidenceType: EvidenceType; status: string }> = [];
    let verified = 0;
    let pending = 0;

    for (const claim of allClaims) {
      const evidenceType = classifyEvidenceType(
        claim.evidenceSource || '',
        claim.evidenceData || ''
      );

      const multiplier = VERIFICATION_MULTIPLIERS[evidenceType];
      // Claims with high-confidence evidence types are auto-verified
      const status = multiplier >= 0.85 ? 'verified' : multiplier >= 0.6 ? 'review_needed' : 'unverified';

      if (status === 'verified') verified++;
      else pending++;

      await db.update(schema.claims)
        .set({
          evidenceType,
          verificationStatus: status,
          lastVerified: new Date().toISOString(),
        })
        .where(eq(schema.claims.id, claim.id));

      results.push({
        claimId: claim.id,
        statement: claim.statement,
        evidenceType,
        status,
      });
    }

    return {
      total: allClaims.length,
      verified,
      pending,
      results,
    };
  } catch (error) {
    console.error('Claims verification failed:', error);
    throw error;
  }
}

export async function calculateTrustScore(brandId: number): Promise<number> {
  try {
    const allClaims = await db.select()
      .from(schema.claims)
      .where(eq(schema.claims.brandId, brandId));

    if (allClaims.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const claim of allClaims) {
      const weight = claim.trustWeight || 1.0;
      const evidenceType = (claim.evidenceType as EvidenceType) || 'self_declared';
      const multiplier = VERIFICATION_MULTIPLIERS[evidenceType] || 0.3;

      weightedSum += weight * multiplier;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    const score = (weightedSum / totalWeight) * 100;
    return Math.round(score * 100) / 100; // 2 decimal places
  } catch (error) {
    console.error('Trust score calculation failed:', error);
    throw error;
  }
}

export async function createAttestation(brandId: number): Promise<{
  attestationId: number;
  cardHash: string;
  trustScore: number;
  signature: string;
}> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    // Get active brand data card
    const cards = await db.select()
      .from(schema.brandDataCards)
      .where(eq(schema.brandDataCards.brandId, brandId));

    const activeCard = cards.find(c => c.isActive);
    const cardJson = activeCard?.cardJson || JSON.stringify({ name: brand.name });

    // Get claims data
    const allClaims = await db.select()
      .from(schema.claims)
      .where(eq(schema.claims.brandId, brandId));

    const verifiedClaims = allClaims.filter(c => c.verificationStatus === 'verified');

    // Calculate trust score
    const trustScore = await calculateTrustScore(brandId);

    // Create HMAC-SHA256 hash of the card
    const secret = process.env.ATTESTATION_SECRET || 'napkin-a2a-default-secret';
    const cardHash = crypto
      .createHmac('sha256', secret)
      .update(cardJson)
      .digest('hex');

    // Create signature of the attestation payload
    const attestationPayload = JSON.stringify({
      brandId,
      cardHash,
      trustScore,
      claimsTotal: allClaims.length,
      claimsVerified: verifiedClaims.length,
      timestamp: new Date().toISOString(),
    });

    const signature = crypto
      .createHmac('sha256', secret)
      .update(attestationPayload)
      .digest('hex');

    // Valid for 30 days
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const [attestation] = await db.insert(schema.attestations).values({
      brandId,
      cardHash,
      trustScore,
      claimsTotal: allClaims.length,
      claimsVerified: verifiedClaims.length,
      signature,
      signedBy: 'did:web:napkin.ie',
      validUntil: validUntil.toISOString(),
    }).returning();

    return {
      attestationId: attestation.id,
      cardHash,
      trustScore,
      signature,
    };
  } catch (error) {
    console.error('Attestation creation failed:', error);
    throw error;
  }
}

export async function generateVerifiableCredential(brandId: number): Promise<Record<string, unknown>> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const trustScore = await calculateTrustScore(brandId);

    const allClaims = await db.select()
      .from(schema.claims)
      .where(eq(schema.claims.brandId, brandId));

    const verifiedClaims = allClaims.filter(c => c.verificationStatus === 'verified');

    const now = new Date().toISOString();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const vc: Record<string, unknown> = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
      ],
      type: ['VerifiableCredential', 'BrandTrustCredential'],
      issuer: {
        id: 'did:web:napkin.ie',
        name: 'NAPKIN A2A Trust Authority',
      },
      issuanceDate: now,
      expirationDate: expirationDate.toISOString(),
      credentialSubject: {
        id: `did:web:napkin.ie:brands:${brandId}`,
        name: brand.name,
        category: brand.category,
        trustScore,
        claimsTotal: allClaims.length,
        claimsVerified: verifiedClaims.length,
        verifiedClaims: verifiedClaims.map(c => ({
          statement: c.statement,
          evidenceType: c.evidenceType,
          lastVerified: c.lastVerified,
        })),
      },
      proof: {
        type: 'HmacSha256Signature2024',
        created: now,
        verificationMethod: 'did:web:napkin.ie#key-1',
        proofPurpose: 'assertionMethod',
      },
    };

    return vc;
  } catch (error) {
    console.error('Verifiable credential generation failed:', error);
    throw error;
  }
}

export async function detectHallucinations(
  brandId: number,
  aiResponse: string
): Promise<Array<{ claim: string; status: 'verified' | 'unverified' | 'contradicted'; detail: string }>> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    // Get all verified claims for comparison
    const allClaims = await db.select()
      .from(schema.claims)
      .where(eq(schema.claims.brandId, brandId));

    // Get brand data card for ground truth
    const cards = await db.select()
      .from(schema.brandDataCards)
      .where(eq(schema.brandDataCards.brandId, brandId));

    const activeCard = cards.find(c => c.isActive);
    const cardData = activeCard ? JSON.parse(activeCard.cardJson) : {};

    const systemPrompt = `You are a fact-checking agent. Compare an AI response about a brand against verified brand data. Identify any claims in the AI response that are:
1. VERIFIED - matches verified brand data
2. UNVERIFIED - cannot be confirmed from available data
3. CONTRADICTED - directly contradicts verified brand data

Return a JSON array of discrepancies found.

Verified brand data:
${JSON.stringify(cardData, null, 2)}

Verified claims:
${allClaims.map(c => `- ${c.statement} (${c.verificationStatus})`).join('\n')}

Return JSON format:
[
  {
    "claim": "the specific claim from the AI response",
    "status": "verified|unverified|contradicted",
    "detail": "explanation of why this status was assigned"
  }
]`;

    const userMessage = `AI Response to analyze:\n\n${aiResponse}`;

    try {
      const text = await callClaude(systemPrompt, userMessage);
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      const results = JSON.parse(jsonMatch[1]!.trim()) as Array<{
        claim: string;
        status: 'verified' | 'unverified' | 'contradicted';
        detail: string;
      }>;
      return results;
    } catch {
      // If parsing fails, return empty array
      return [];
    }
  } catch (error) {
    console.error('Hallucination detection failed:', error);
    throw error;
  }
}
