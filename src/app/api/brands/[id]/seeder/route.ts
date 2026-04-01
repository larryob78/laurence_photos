import { NextRequest, NextResponse } from 'next/server';
import { generateSeedingCampaign } from '@/agents/seeder';

// POST /api/brands/[id]/seeder - Generate seeding campaign
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
    const { campaignType } = body;

    const validTypes = ['social', 'email', 'onboarding', 'in-app'];
    if (!campaignType || !validTypes.includes(campaignType)) {
      return NextResponse.json(
        { error: `campaignType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const campaign = await generateSeedingCampaign(brandId, campaignType);
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Seeding campaign failed:', error);
    const message = error instanceof Error ? error.message : 'Seeding campaign generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
