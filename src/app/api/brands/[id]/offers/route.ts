import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/brands/[id]/offers - Get all offer rules
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

    const rules = await db
      .select()
      .from(schema.offerRules)
      .where(eq(schema.offerRules.brandId, brandId));

    return NextResponse.json(rules.map(r => ({
      ...r,
      triggerKeywords: r.triggerKeywords ? JSON.parse(r.triggerKeywords) : [],
    })));
  } catch (error) {
    console.error('Failed to get offer rules:', error);
    return NextResponse.json({ error: 'Failed to get offer rules' }, { status: 500 });
  }
}

// POST /api/brands/[id]/offers - Create new offer rule
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
    const { triggerWhen, triggerKeywords, offerText, offerType, discountPercent, conditions } = body;

    const [rule] = await db.insert(schema.offerRules).values({
      brandId,
      triggerWhen: triggerWhen || null,
      triggerKeywords: triggerKeywords ? JSON.stringify(triggerKeywords) : null,
      offerText: offerText || null,
      offerType: offerType || null,
      discountPercent: discountPercent || null,
      conditions: conditions || null,
      isActive: 1,
    }).returning();

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Failed to create offer rule:', error);
    return NextResponse.json({ error: 'Failed to create offer rule' }, { status: 500 });
  }
}

// PUT /api/brands/[id]/offers - Update offer rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _id } = await params;
    const body = await request.json();
    const { id: ruleId, triggerWhen, triggerKeywords, offerText, offerType, discountPercent, conditions, isActive } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'id (rule ID) is required in body' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (triggerWhen !== undefined) updateData.triggerWhen = triggerWhen;
    if (triggerKeywords !== undefined) updateData.triggerKeywords = JSON.stringify(triggerKeywords);
    if (offerText !== undefined) updateData.offerText = offerText;
    if (offerType !== undefined) updateData.offerType = offerType;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(schema.offerRules)
      .set(updateData)
      .where(eq(schema.offerRules.id, ruleId));

    const [updated] = await db.select().from(schema.offerRules).where(eq(schema.offerRules.id, ruleId));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update offer rule:', error);
    return NextResponse.json({ error: 'Failed to update offer rule' }, { status: 500 });
  }
}
