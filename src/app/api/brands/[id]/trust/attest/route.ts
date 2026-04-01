import { NextRequest, NextResponse } from 'next/server';
import { createAttestation } from '@/agents/trust-agent';

// POST /api/brands/[id]/trust/attest - Create new attestation
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

    const attestation = await createAttestation(brandId);
    return NextResponse.json(attestation, { status: 201 });
  } catch (error) {
    console.error('Attestation creation failed:', error);
    const message = error instanceof Error ? error.message : 'Attestation creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
