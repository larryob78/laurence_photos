import { NextRequest, NextResponse } from 'next/server';
import { runDecisionLineage } from '@/agents/scout';

// POST /api/brands/[id]/audit/lineage - Run decision lineage analysis
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
    const { queryText } = body;

    if (!queryText) {
      return NextResponse.json({ error: 'queryText is required' }, { status: 400 });
    }

    const analysis = await runDecisionLineage(brandId, queryText);
    return NextResponse.json({ queryText, analysis });
  } catch (error) {
    console.error('Decision lineage failed:', error);
    const message = error instanceof Error ? error.message : 'Decision lineage analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
