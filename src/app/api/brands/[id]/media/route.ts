import { NextRequest, NextResponse } from 'next/server';
import { getPlatformMatrix, generateMediaPlan } from '@/agents/media-agent';

// GET /api/brands/[id]/media - Get platform matrix and existing media plan
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

    const platformMatrix = getPlatformMatrix();

    return NextResponse.json({
      brandId,
      platformMatrix,
    });
  } catch (error) {
    console.error('Failed to get media data:', error);
    return NextResponse.json({ error: 'Failed to get media data' }, { status: 500 });
  }
}

// POST /api/brands/[id]/media - Generate media plan
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
    const { budget } = body;

    if (!budget || typeof budget !== 'number' || budget <= 0) {
      return NextResponse.json({ error: 'budget must be a positive number' }, { status: 400 });
    }

    const mediaPlan = await generateMediaPlan(brandId, budget);
    return NextResponse.json(mediaPlan);
  } catch (error) {
    console.error('Media plan generation failed:', error);
    const message = error instanceof Error ? error.message : 'Media plan generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
