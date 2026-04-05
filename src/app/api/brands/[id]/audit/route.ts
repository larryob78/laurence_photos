import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { runBrandAudit } from '@/agents/scout';

// POST /api/brands/[id]/audit - Run a live audit
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

    const result = await runBrandAudit(brandId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Audit failed:', error);
    const message = error instanceof Error ? error.message : 'Audit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/brands/[id]/audit - Get audit history
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

    const runs = await db
      .select()
      .from(schema.auditRuns)
      .where(eq(schema.auditRuns.brandId, brandId))
      .orderBy(desc(schema.auditRuns.runDate));

    // For each run, fetch results
    const runsWithResults = await Promise.all(
      runs.map(async (run) => {
        const results = await db
          .select()
          .from(schema.auditResults)
          .where(eq(schema.auditResults.auditRunId, run.id));

        return {
          ...run,
          summaryJson: run.summaryJson ? JSON.parse(run.summaryJson) : null,
          results,
        };
      })
    );

    return NextResponse.json(runsWithResults);
  } catch (error) {
    console.error('Failed to get audit history:', error);
    return NextResponse.json({ error: 'Failed to get audit history' }, { status: 500 });
  }
}
