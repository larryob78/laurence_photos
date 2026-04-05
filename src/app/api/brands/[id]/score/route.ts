import { NextRequest, NextResponse } from 'next/server';
import { scoreContent } from '@/agents/cd-brain';

// POST /api/brands/[id]/score - Score content using CD Brain
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
    const { content, contentType } = body;

    if (!content || !contentType) {
      return NextResponse.json({ error: 'content and contentType are required' }, { status: 400 });
    }

    const score = await scoreContent(content, contentType);
    return NextResponse.json({ brandId, ...score });
  } catch (error) {
    console.error('Content scoring failed:', error);
    const message = error instanceof Error ? error.message : 'Content scoring failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
