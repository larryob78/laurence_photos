import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { desc, sql } from 'drizzle-orm';

// GET /api/brands - List all brands with latest ARB and trust scores
export async function GET() {
  try {
    const allBrands = await db.select().from(schema.brands);

    const brandsWithScores = await Promise.all(
      allBrands.map(async (brand) => {
        // Get latest asov daily record for this brand
        const latestAsov = await db
          .select()
          .from(schema.asovDaily)
          .where(sql`${schema.asovDaily.brandId} = ${brand.id}`)
          .orderBy(desc(schema.asovDaily.date))
          .limit(1);

        // Get latest attestation for trust score
        const latestAttestation = await db
          .select()
          .from(schema.attestations)
          .where(sql`${schema.attestations.brandId} = ${brand.id}`)
          .orderBy(desc(schema.attestations.createdAt))
          .limit(1);

        return {
          ...brand,
          competitors: brand.competitors ? JSON.parse(brand.competitors) : [],
          latestArbScore: latestAsov[0]?.arbScore ?? null,
          latestAsovScore: latestAsov[0]?.asovScore ?? null,
          trustScore: latestAttestation[0]?.trustScore ?? null,
        };
      })
    );

    return NextResponse.json(brandsWithScores);
  } catch (error) {
    console.error('Failed to list brands:', error);
    return NextResponse.json({ error: 'Failed to list brands' }, { status: 500 });
  }
}

// POST /api/brands - Create a new brand with all related data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      description,
      competitors,
      personality,
      websiteUrl,
      auditQueries,
      offerRules,
      trustClaims,
      governancePolicies,
      brandDataCard,
    } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'name and category are required' }, { status: 400 });
    }

    // Insert brand
    const [brand] = await db.insert(schema.brands).values({
      name,
      category,
      description: description || null,
      competitors: competitors ? JSON.stringify(competitors) : null,
      personality: personality || null,
      websiteUrl: websiteUrl || null,
    }).returning();

    // Insert audit queries
    if (auditQueries && Array.isArray(auditQueries)) {
      for (const q of auditQueries) {
        await db.insert(schema.auditQueries).values({
          brandId: brand.id,
          queryText: typeof q === 'string' ? q : q.queryText,
          category: typeof q === 'string' ? null : q.category || null,
          isActive: 1,
        });
      }
    }

    // Insert offer rules
    if (offerRules && Array.isArray(offerRules)) {
      for (const rule of offerRules) {
        await db.insert(schema.offerRules).values({
          brandId: brand.id,
          triggerWhen: rule.triggerWhen || null,
          triggerKeywords: rule.triggerKeywords ? JSON.stringify(rule.triggerKeywords) : null,
          offerText: rule.offerText || null,
          offerType: rule.offerType || null,
          discountPercent: rule.discountPercent || null,
          conditions: rule.conditions || null,
          isActive: 1,
        });
      }
    }

    // Insert trust claims
    if (trustClaims && Array.isArray(trustClaims)) {
      for (const claim of trustClaims) {
        await db.insert(schema.claims).values({
          brandId: brand.id,
          category: claim.category || null,
          statement: claim.statement || null,
          claimedValue: claim.claimedValue || null,
          trustWeight: claim.trustWeight ?? 1.0,
          verificationStatus: 'pending',
        });
      }
    }

    // Insert governance policies
    if (governancePolicies && Array.isArray(governancePolicies)) {
      for (const policy of governancePolicies) {
        await db.insert(schema.brandPolicies).values({
          brandId: brand.id,
          policyType: policy.policyType || null,
          rule: policy.rule || null,
          enforcement: policy.enforcement || 'warn',
          isActive: 1,
        });
      }
    }

    // Insert brand data card
    if (brandDataCard) {
      await db.insert(schema.brandDataCards).values({
        brandId: brand.id,
        cardJson: typeof brandDataCard === 'string' ? brandDataCard : JSON.stringify(brandDataCard),
        version: 1,
        isActive: 1,
      });
    }

    return NextResponse.json({ brand, message: 'Brand created with all related data' }, { status: 201 });
  } catch (error) {
    console.error('Failed to create brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
