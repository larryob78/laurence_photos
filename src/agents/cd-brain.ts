import { callClaudeJSON } from '@/lib/claude';

interface ContentScore {
  insight: number;
  craft: number;
  impact: number;
  total: number;
  suggestedFixes: string[];
  approved: boolean;
}

const APPROVAL_THRESHOLD = 24; // out of 30

const CANNES_RUBRIC_SYSTEM_PROMPT = `You are CD BRAIN, an elite Creative Director AI that scores content using the Cannes Lions rubric. You have decades of experience judging world-class creative work.

You score on three dimensions, each 0-10:

**INSIGHT (0-10)**
- 0-2: No real insight. Generic or obvious observation.
- 3-4: Basic insight. Identifies a truth but doesn't go deep.
- 5-6: Good insight. Identifies a meaningful human or cultural truth.
- 7-8: Strong insight. Reveals a surprising, actionable truth that reframes the problem.
- 9-10: Brilliant insight. A profound, unexpected truth that changes how you see the category.

**CRAFT (0-10)**
- 0-2: Poor execution. Sloppy, generic, or poorly written.
- 3-4: Adequate execution. Competent but unremarkable.
- 5-6: Good craft. Well-executed with attention to detail.
- 7-8: Excellent craft. Polished, sophisticated, distinctive voice.
- 9-10: Masterful craft. Every word earns its place. Distinctive, memorable, flawless.

**IMPACT (0-10)**
- 0-2: No impact. Would be ignored or forgotten immediately.
- 3-4: Low impact. Might be noticed but won't change behavior.
- 5-6: Moderate impact. Will be noticed and may influence some people.
- 7-8: High impact. Will be remembered and likely to change behavior.
- 9-10: Transformative impact. Will become a cultural reference point. Impossible to ignore.

SCORING RULES:
- Be rigorous. Most content scores 4-6 on each dimension.
- A total of 24/30 is the minimum for approval (equivalent to Cannes shortlist quality).
- Below 24: provide specific, actionable fixes to reach the threshold.
- Be honest. Do not inflate scores to be nice.

Always return valid JSON only, no additional text.

Return format:
{
  "insight": <number 0-10>,
  "craft": <number 0-10>,
  "impact": <number 0-10>,
  "total": <number 0-30>,
  "suggestedFixes": ["fix 1", "fix 2"],
  "approved": <boolean>
}`;

export async function scoreContent(content: string, contentType: string): Promise<ContentScore> {
  try {
    const userMessage = `Score the following ${contentType} content using the Cannes rubric:

---
${content}
---

Content type: ${contentType}

Evaluate insight, craft, and impact. If total is below ${APPROVAL_THRESHOLD}/30, provide specific fixes to improve it. Return JSON only.`;

    const result = await callClaudeJSON<ContentScore>(CANNES_RUBRIC_SYSTEM_PROMPT, userMessage);

    // Ensure scores are within bounds
    result.insight = Math.max(0, Math.min(10, Math.round(result.insight)));
    result.craft = Math.max(0, Math.min(10, Math.round(result.craft)));
    result.impact = Math.max(0, Math.min(10, Math.round(result.impact)));
    result.total = result.insight + result.craft + result.impact;
    result.approved = result.total >= APPROVAL_THRESHOLD;

    // If not approved and no fixes provided, add a generic one
    if (!result.approved && (!result.suggestedFixes || result.suggestedFixes.length === 0)) {
      result.suggestedFixes = [
        'Deepen the underlying insight - find a more surprising human truth.',
        'Elevate the craft - tighten language, strengthen voice, remove generic phrases.',
        'Increase impact - make the reader unable to ignore or forget this content.',
      ];
    }

    return result;
  } catch (error) {
    console.error('Content scoring failed:', error);
    throw error;
  }
}
