import { NextRequest, NextResponse } from 'next/server';
import { detectHallucinations } from '@/agents/trust-agent';

// POST /api/brands/[id]/trust/hallucinations - Detect hallucinations
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
    const { aiResponse } = body;

    if (!aiResponse) {
      return NextResponse.json({ error: 'aiResponse is required' }, { status: 400 });
    }

    const results = await detectHallucinations(brandId, aiResponse);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Hallucination detection failed:', error);
    const message = error instanceof Error ? error.message : 'Hallucination detection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
