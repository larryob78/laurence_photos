import { NextRequest, NextResponse } from 'next/server';
import { negotiateOffer } from '@/agents/dealer';

// POST /api/brands/[id]/battlefield - Run a batch of negotiations for battlefield visualization
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
    const { queries } = body;

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'queries array is required with at least one entry' },
        { status: 400 }
      );
    }

    const results = [];

    for (const entry of queries) {
      const { consumerAgent, query } = entry;

      if (!consumerAgent || !query) {
        results.push({
          consumerAgent: consumerAgent || 'unknown',
          query: query || '',
          error: 'consumerAgent and query are required',
        });
        continue;
      }

      try {
        const result = await negotiateOffer(brandId, consumerAgent, query);
        results.push({
          consumerAgent,
          query,
          ...result,
        });
      } catch (err) {
        results.push({
          consumerAgent,
          query,
          error: err instanceof Error ? err.message : 'Negotiation failed',
        });
      }

      // Small delay between sequential negotiations to avoid rate limiting
      if (queries.indexOf(entry) < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      brandId,
      totalQueries: queries.length,
      results,
    });
  } catch (error) {
    console.error('Battlefield simulation failed:', error);
    const message = error instanceof Error ? error.message : 'Battlefield simulation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
