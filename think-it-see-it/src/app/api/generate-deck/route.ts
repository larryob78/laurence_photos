import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, generateDeckPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { extraction, route, format = "pitch" } = await req.json();
    if (!extraction || !route) {
      return NextResponse.json({ error: "extraction and route are required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const sceneTypes = ["title", "insight", "tension", "idea", "evidence", "idea", "action", "closing"] as const;
      const accents = ["#FF3366", "#6C5CE7", "#00B894", "#FDCB6E", "#E17055", "#0984E3", "#00CEC9", "#E84393"];

      return NextResponse.json({
        id: "deck-" + Date.now(),
        title: route.name || "Untitled Deck",
        subtitle: route.concept?.slice(0, 80) || "A living presentation",
        scenes: (route.scenes || []).map((s: { title: string; intent: string }, i: number) => ({
          id: `scene-${i + 1}`,
          order: i + 1,
          headline: s.title,
          subheadline: s.intent,
          bodyText: format === "pitch"
            ? "This scene drives the narrative forward with precision and purpose."
            : "Take a moment to discuss this with your team. What resonates? What challenges your thinking?",
          visualDirection: route.visualWorld || "Clean, modern visual approach",
          speakerNotes: `Key point: ${s.intent}. Pause here for emphasis.`,
          sceneType: sceneTypes[i % sceneTypes.length],
          colorAccent: accents[i % accents.length],
        })),
        creativeRouteId: route.id,
        format,
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
          {
            role: "user",
            content: generateDeckPrompt(
              JSON.stringify(extraction),
              JSON.stringify(route),
              format
            ),
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({
      ...result,
      id: "deck-" + Date.now(),
      creativeRouteId: route.id,
      format,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Generate deck error:", error);
    return NextResponse.json(
      { error: "Failed to generate deck" },
      { status: 500 }
    );
  }
}
