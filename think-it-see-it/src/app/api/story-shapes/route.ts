import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, storyShapesPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { extraction } = await req.json();
    if (!extraction) {
      return NextResponse.json({ error: "extraction is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\nReturn your response as a JSON object with a 'shapes' array." },
          { role: "user", content: storyShapesPrompt(JSON.stringify(extraction)) },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(result.shapes || result);
  } catch (error) {
    console.error("Story shapes error:", error);
    return NextResponse.json(
      { error: "Failed to generate story shapes" },
      { status: 500 }
    );
  }
}
