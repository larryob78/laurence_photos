import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { verifyClaims, calculateTrustScore } from '@/agents/trust-agent';

// GET /api/brands/[id]/trust - Get trust data
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

    const [allClaims, attestations, trustScore] = await Promise.all([
      db.select().from(schema.claims).where(eq(schema.claims.brandId, brandId)),
      db.select().from(schema.attestations).where(eq(schema.attestations.brandId, brandId)).orderBy(desc(schema.attestations.createdAt)),
      calculateTrustScore(brandId),
    ]);

    return NextResponse.json({
      trustScore,
      claims: allClaims,
      attestations,
      latestAttestation: attestations[0] || null,
    });
  } catch (error) {
    console.error('Failed to get trust data:', error);
    return NextResponse.json({ error: 'Failed to get trust data' }, { status: 500 });
  }
}

// POST /api/brands/[id]/trust - Run trust verification
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = parseInt(id, 10);
    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const [verificationResults, trustScore] = await Promise.all([
      verifyClaims(brandId),
      calculateTrustScore(brandId),
    ]);

    return NextResponse.json({
      trustScore,
      verification: verificationResults,
    });
  } catch (error) {
    console.error('Trust verification failed:', error);
    return NextResponse.json({ error: 'Trust verification failed' }, { status: 500 });
  }
}
