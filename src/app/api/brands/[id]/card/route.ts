import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { generateBrandDataCard } from '@/agents/card-builder';

// GET /api/brands/[id]/card - Get active brand data card
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

    const cards = await db
      .select()
      .from(schema.brandDataCards)
      .where(eq(schema.brandDataCards.brandId, brandId));

    const activeCard = cards.find(c => c.isActive);

    if (!activeCard) {
      return NextResponse.json({ error: 'No active brand data card found' }, { status: 404 });
    }

    return NextResponse.json({
      ...activeCard,
      cardJson: JSON.parse(activeCard.cardJson),
    });
  } catch (error) {
    console.error('Failed to get brand data card:', error);
    return NextResponse.json({ error: 'Failed to get brand data card' }, { status: 500 });
  }
}

// POST /api/brands/[id]/card - Regenerate brand data card
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

    const cardJson = await generateBrandDataCard(brandId);
    return NextResponse.json(cardJson, { status: 201 });
  } catch (error) {
    console.error('Card generation failed:', error);
    const message = error instanceof Error ? error.message : 'Card generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
