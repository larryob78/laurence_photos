import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/claude';

interface AutocompleteResult {
  description: string;
  personality: string;
  competitors: string[];
  auditQueries: string[];
  offerRules: Array<{
    triggerWhen: string;
    triggerKeywords: string[];
    offerText: string;
    offerType: string;
  }>;
  trustClaims: Array<{
    category: string;
    statement: string;
    claimedValue: string;
    trustWeight: number;
  }>;
  governancePolicies: Array<{
    policyType: string;
    rule: string;
    enforcement: string;
  }>;
  brandDataCard: Record<string, unknown>;
}

// POST /api/brands/autocomplete - THE KILLER FEATURE
// Generate all brand data from just a name and category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, category } = body;

    if (!brandName || !category) {
      return NextResponse.json({ error: 'brandName and category are required' }, { status: 400 });
    }

    const systemPrompt = 'Return only valid JSON. No explanation.';

    const userMessage = `Generate comprehensive brand data for "${brandName}" in the "${category}" category. Return a single JSON object with ALL of the following:

1. "description": 2-3 sentence brand description
2. "personality": 3-sentence agent prompt starting with "You are"
3. "competitors": array of exactly 4 competitor brand names
4. "auditQueries": array of exactly 10 search queries mixing discovery ("best X for Y"), comparison ("X vs Y"), and purchase intent ("where to buy X") queries that a consumer might ask an AI assistant
5. "offerRules": array of exactly 5 objects, each with:
   - "triggerWhen": description of when to trigger
   - "triggerKeywords": array of 3-5 keyword strings
   - "offerText": the offer to present
   - "offerType": one of "discount", "bundle", "trial", "loyalty", "seasonal"
6. "trustClaims": array of exactly 10 objects, each with:
   - "category": one of "product", "service", "sustainability", "pricing", "quality", "safety", "privacy", "accessibility", "awards", "certifications"
   - "statement": the specific claim
   - "claimedValue": the claimed metric or value
   - "trustWeight": number between 0.5 and 2.0 indicating importance
7. "governancePolicies": array of exactly 5 objects, each with:
   - "policyType": one of "tone", "claims", "pricing", "competitor", "legal"
   - "rule": comma-separated list of terms/rules to enforce
   - "enforcement": one of "block", "warn", "flag"
8. "brandDataCard": a complete JSON-LD object with @context "https://schema.org", @type ["Organization", "Product"], name, description, category, url, usps (array), pricing (object with model, range, currency), trustSignals (object with trustpilotScore, certifications, awards), sustainability, accessibility, and agentCommerce (object with stripeACP, googleUCP, negotiationEndpoint)

Return ONLY the JSON object. No markdown, no code blocks, no explanation.`;

    const result = await callClaudeJSON<AutocompleteResult>(systemPrompt, userMessage, 8192);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Autocomplete failed:', error);
    const message = error instanceof Error ? error.message : 'Autocomplete generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
