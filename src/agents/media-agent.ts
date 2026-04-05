import { db, schema } from '@/db';
import { callClaudeJSON } from '@/lib/claude';
import { eq } from 'drizzle-orm';

interface PlatformInfo {
  hasAds: boolean;
  reach: string;
  model: string;
}

interface PlatformMatrix {
  [platform: string]: PlatformInfo;
}

interface MediaPlanAllocation {
  platform: string;
  channel: 'paid' | 'organic';
  budgetAllocation: number;
  estimatedAgentCPM: number;
  strategy: string;
  priority: 'high' | 'medium' | 'low';
}

interface MediaPlan {
  totalBudget: number;
  paidBudget: number;
  organicBudget: number;
  agentCPM: number;
  allocations: MediaPlanAllocation[];
  recommendations: string[];
}

const PLATFORM_MATRIX: PlatformMatrix = {
  ChatGPT: { hasAds: true, reach: '800M weekly', model: 'paid+organic' },
  Claude: { hasAds: false, reach: 'growing', model: 'organic only' },
  Gemini: { hasAds: true, reach: '1.5B monthly', model: 'paid (AI Overviews)' },
  Perplexity: { hasAds: false, reach: '780M monthly queries', model: 'organic' },
  Poe: { hasAds: false, reach: '15.5M monthly', model: 'bot creator monetization' },
  Copilot: { hasAds: true, reach: 'testing', model: 'testing ads' },
};

export function getPlatformMatrix(): PlatformMatrix {
  return { ...PLATFORM_MATRIX };
}

export async function generateMediaPlan(brandId: number, budget: number): Promise<MediaPlan> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const competitors: string[] = brand.competitors ? JSON.parse(brand.competitors) : [];

    // Split budget: 60% paid platforms, 40% organic efforts
    const paidBudget = budget * 0.6;
    const organicBudget = budget * 0.4;

    // Calculate Agent CPM (cost per thousand AI-mediated interactions)
    // Estimated based on budget and estimated reach
    const estimatedMonthlyImpressions = budget * 50; // rough estimate
    const agentCPM = (budget / estimatedMonthlyImpressions) * 1000;

    const systemPrompt = `You are THE MEDIA AGENT, an expert in AI agent media planning. You understand the landscape of AI platforms where brands need visibility. You allocate budgets between paid and organic channels across AI platforms.

Platform data:
${Object.entries(PLATFORM_MATRIX).map(([name, info]) =>
  `- ${name}: ads=${info.hasAds}, reach=${info.reach}, model=${info.model}`
).join('\n')}

Return valid JSON only.`;

    const userMessage = `Create a media plan for:

Brand: ${brand.name}
Category: ${brand.category}
Description: ${brand.description || 'N/A'}
Competitors: ${competitors.join(', ') || 'N/A'}

Total Budget: $${budget}
Paid Budget: $${paidBudget}
Organic Budget: $${organicBudget}

Generate a media plan with allocations across the AI platforms. For each platform, specify:
- channel: "paid" or "organic"
- budgetAllocation: dollar amount
- estimatedAgentCPM: estimated cost per thousand AI-mediated interactions
- strategy: brief strategy description
- priority: "high", "medium", or "low"

Also provide 5 strategic recommendations.

Return JSON format:
{
  "allocations": [
    {
      "platform": "ChatGPT",
      "channel": "paid",
      "budgetAllocation": 5000,
      "estimatedAgentCPM": 12.50,
      "strategy": "strategy description",
      "priority": "high"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const result = await callClaudeJSON<{
      allocations: MediaPlanAllocation[];
      recommendations: string[];
    }>(systemPrompt, userMessage);

    return {
      totalBudget: budget,
      paidBudget,
      organicBudget,
      agentCPM,
      allocations: result.allocations || [],
      recommendations: result.recommendations || [],
    };
  } catch (error) {
    console.error('Media plan generation failed:', error);
    throw error;
  }
}
