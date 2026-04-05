import { NextRequest, NextResponse } from 'next/server';
import { calculateARBScore, generateWeeklyStrategy } from '@/agents/conductor';

// GET /api/brands/[id]/conductor - Get current ARB score breakdown
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

    const arbScore = await calculateARBScore(brandId);
    return NextResponse.json(arbScore);
  } catch (error) {
    console.error('ARB score calculation failed:', error);
    const message = error instanceof Error ? error.message : 'ARB score calculation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/brands/[id]/conductor - Generate weekly strategy recommendation
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

    const strategy = await generateWeeklyStrategy(brandId);
    return NextResponse.json({ brandId, strategy });
  } catch (error) {
    console.error('Weekly strategy generation failed:', error);
    const message = error instanceof Error ? error.message : 'Weekly strategy generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
