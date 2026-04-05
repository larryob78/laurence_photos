import { NextRequest, NextResponse } from 'next/server';
import { generateVerifiableCredential } from '@/agents/trust-agent';

// POST /api/brands/[id]/trust/credential - Generate W3C Verifiable Credential
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

    const credential = await generateVerifiableCredential(brandId);
    return NextResponse.json(credential);
  } catch (error) {
    console.error('Credential generation failed:', error);
    const message = error instanceof Error ? error.message : 'Credential generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
