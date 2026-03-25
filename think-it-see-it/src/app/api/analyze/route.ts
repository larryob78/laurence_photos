import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, analyzePrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return mock data for demo mode
      return NextResponse.json({
        objective: "Launch a bold new brand positioning that challenges category conventions",
        audience: "Marketing directors and CMOs at mid-to-large consumer brands seeking differentiation",
        keyInsights: [
          "The category has become commoditized — everyone sounds the same",
          "Consumers are craving authenticity over polish",
          "There's a gap between what brands say and what they do",
          "Cultural relevance beats traditional advertising effectiveness",
        ],
        tensions: [
          "The brand wants to be disruptive but the organization is risk-averse",
          "Consumers want authenticity but also expect premium production quality",
        ],
        opportunities: [
          "First-mover advantage in reframing the category conversation",
          "Leverage cultural moments to drive organic reach",
          "Build a community-first approach that creates owned media value",
        ],
        tone: "Confident, provocative, and culturally fluent",
        rawSummary: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
      });
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: analyzePrompt(text) },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze input" },
      { status: 500 }
    );
  }
}
