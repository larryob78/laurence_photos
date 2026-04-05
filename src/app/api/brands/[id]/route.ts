import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/brands/[id] - Get single brand with all related data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = parseInt(id, 10);
    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [queries, rules, allClaims, policies, attestations, allAsovData, cards] = await Promise.all([
      db.select().from(schema.auditQueries).where(eq(schema.auditQueries.brandId, brandId)),
      db.select().from(schema.offerRules).where(eq(schema.offerRules.brandId, brandId)),
      db.select().from(schema.claims).where(eq(schema.claims.brandId, brandId)),
      db.select().from(schema.brandPolicies).where(eq(schema.brandPolicies.brandId, brandId)),
      db.select().from(schema.attestations).where(eq(schema.attestations.brandId, brandId)).orderBy(desc(schema.attestations.createdAt)).limit(1),
      db.select().from(schema.asovDaily).where(eq(schema.asovDaily.brandId, brandId)).orderBy(desc(schema.asovDaily.date)),
      db.select().from(schema.brandDataCards).where(eq(schema.brandDataCards.brandId, brandId)),
    ]);

    const activeCard = cards.find(c => c.isActive);

    return NextResponse.json({
      ...brand,
      competitors: brand.competitors ? JSON.parse(brand.competitors) : [],
      auditQueries: queries,
      offerRules: rules,
      claims: allClaims,
      policies,
      latestAttestation: attestations[0] || null,
      latestAsov: allAsovData[0] || null,
      asovDaily: allAsovData.reverse(),
      dataCard: activeCard ? { ...activeCard, cardJson: JSON.parse(activeCard.cardJson) } : null,
    });
  } catch (error) {
    console.error('Failed to get brand:', error);
    return NextResponse.json({ error: 'Failed to get brand' }, { status: 500 });
  }
}

// DELETE /api/brands/[id] - Delete brand and all related data
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = parseInt(id, 10);
    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    // Delete all related data first
    await db.delete(schema.auditResults).where(
      eq(schema.auditResults.auditRunId,
        db.select({ id: schema.auditRuns.id }).from(schema.auditRuns).where(eq(schema.auditRuns.brandId, brandId)).limit(1) as unknown as number
      )
    ).catch(() => { /* ignore if no results */ });

    await Promise.all([
      db.delete(schema.auditQueries).where(eq(schema.auditQueries.brandId, brandId)),
      db.delete(schema.auditRuns).where(eq(schema.auditRuns.brandId, brandId)),
      db.delete(schema.offerRules).where(eq(schema.offerRules.brandId, brandId)),
      db.delete(schema.negotiations).where(eq(schema.negotiations.brandId, brandId)),
      db.delete(schema.claims).where(eq(schema.claims.brandId, brandId)),
      db.delete(schema.attestations).where(eq(schema.attestations.brandId, brandId)),
      db.delete(schema.brandPolicies).where(eq(schema.brandPolicies.brandId, brandId)),
      db.delete(schema.asovDaily).where(eq(schema.asovDaily.brandId, brandId)),
      db.delete(schema.brandDataCards).where(eq(schema.brandDataCards.brandId, brandId)),
    ]);

    // Delete the brand itself
    await db.delete(schema.brands).where(eq(schema.brands.id, brandId));

    return NextResponse.json({ message: 'Brand and all related data deleted' });
  } catch (error) {
    console.error('Failed to delete brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
