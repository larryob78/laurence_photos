import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/brands/[id]/governance - Get all policies for brand
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

    const policies = await db
      .select()
      .from(schema.brandPolicies)
      .where(eq(schema.brandPolicies.brandId, brandId));

    return NextResponse.json(policies);
  } catch (error) {
    console.error('Failed to get policies:', error);
    return NextResponse.json({ error: 'Failed to get policies' }, { status: 500 });
  }
}

// POST /api/brands/[id]/governance - Create new policy
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
    const { policyType, rule, enforcement } = body;

    if (!policyType || !rule) {
      return NextResponse.json({ error: 'policyType and rule are required' }, { status: 400 });
    }

    const [policy] = await db.insert(schema.brandPolicies).values({
      brandId,
      policyType,
      rule,
      enforcement: enforcement || 'warn',
      isActive: 1,
    }).returning();

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Failed to create policy:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}

// PUT /api/brands/[id]/governance - Update policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _id } = await params;
    const body = await request.json();
    const { id: policyId, policyType, rule, enforcement, isActive } = body;

    if (!policyId) {
      return NextResponse.json({ error: 'id (policy ID) is required in body' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (policyType !== undefined) updateData.policyType = policyType;
    if (rule !== undefined) updateData.rule = rule;
    if (enforcement !== undefined) updateData.enforcement = enforcement;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(schema.brandPolicies)
      .set(updateData)
      .where(eq(schema.brandPolicies.id, policyId));

    const [updated] = await db
      .select()
      .from(schema.brandPolicies)
      .where(eq(schema.brandPolicies.id, policyId));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update policy:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}
