import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { negotiateOffer } from '@/agents/dealer';

// POST /api/brands/[id]/negotiate - Run a negotiation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = parseInt(id, 10);
    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    const body = await request.json();
    const { consumerAgent, inboundQuery } = body;

    if (!consumerAgent || !inboundQuery) {
      return NextResponse.json({ error: 'consumerAgent and inboundQuery are required' }, { status: 400 });
    }

    const result = await negotiateOffer(brandId, consumerAgent, inboundQuery);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Negotiation failed:', error);
    const message = error instanceof Error ? error.message : 'Negotiation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/brands/[id]/negotiate - Get negotiation history
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

    const negotiations = await db
      .select()
      .from(schema.negotiations)
      .where(eq(schema.negotiations.brandId, brandId))
      .orderBy(desc(schema.negotiations.createdAt))
      .limit(50);

    return NextResponse.json(negotiations);
  } catch (error) {
    console.error('Failed to get negotiations:', error);
    return NextResponse.json({ error: 'Failed to get negotiation history' }, { status: 500 });
  }
}
