import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, storyShapesPrompt } from "@/lib/prompts";
import { generateJSON, isDemoMode } from "@/lib/ai-server";

export async function POST(req: Request) {
  try {
    const { extraction } = await req.json();
    if (!extraction) {
      return NextResponse.json({ error: "extraction is required" }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json([
        {
          id: "shape-1",
          name: "The Challenger Arc",
          description: "Opens by confronting the audience with an uncomfortable truth about their category. Builds tension, then pivots to a bold new way of thinking. Ends with a rallying cry.",
          arc: ["The Comfortable Lie", "The Uncomfortable Truth", "The Turning Point", "The New Way", "The Evidence", "The Ask"],
          reasoning: "This shape works because the input suggests a desire to challenge conventions. A confrontational opening grabs attention and positions the brand as brave.",
        },
        {
          id: "shape-2",
          name: "The Cultural Wave",
          description: "Starts from the outside in — what's happening in culture, then zooms into the category, then into the brand opportunity. Feels current and connected.",
          arc: ["The Cultural Moment", "The Category Reality", "The Consumer Truth", "The Brand Opportunity", "The Creative Leap", "The Roadmap"],
          reasoning: "This shape leverages cultural relevance — it makes the brand feel like a natural response to what's already happening rather than a manufactured position.",
        },
        {
          id: "shape-3",
          name: "The Evidence Engine",
          description: "Leads with data and proof points, building an irrefutable case. Each insight compounds the next. The creative idea feels inevitable rather than imposed.",
          arc: ["The Data Point", "The Pattern", "The Insight", "The Implication", "The Idea", "The Proof It Works", "The Next Step"],
          reasoning: "For risk-averse stakeholders, this evidence-led approach builds confidence. The creative idea lands harder because it feels earned.",
        },
      ]);
    }

    const result = await generateJSON(
      SYSTEM_PROMPT + "\nReturn your response as a JSON object with a 'shapes' array.",
      storyShapesPrompt(JSON.stringify(extraction)),
      0.8
    );
    return NextResponse.json((result as { shapes?: unknown[] }).shapes || result);
  } catch (error) {
    console.error("Story shapes error:", error);
    return NextResponse.json({ error: "Failed to generate story shapes" }, { status: 500 });
  }
}
