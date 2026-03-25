import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { scene, instruction, context } = await req.json();
    if (!scene || !instruction) {
      return NextResponse.json(
        { error: "scene and instruction are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Demo mode: apply simple transformations
      const lower = instruction.toLowerCase();
      let headline = scene.headline;
      let bodyText = scene.bodyText;
      const subheadline = scene.subheadline;

      if (lower.includes("shorter") || lower.includes("concise")) {
        headline = headline.split(" ").slice(0, 5).join(" ");
        bodyText = bodyText.split(". ")[0] + ".";
      } else if (lower.includes("bolder") || lower.includes("provocative")) {
        headline = headline.toUpperCase();
        if (!headline.endsWith(".")) headline += ".";
      } else if (lower.includes("question")) {
        headline = headline.replace(/\.$/, "?");
        if (!headline.endsWith("?")) headline += "?";
      } else {
        // Generic refinement: add emphasis
        headline = headline.replace(/^The /, "THE ");
        bodyText = bodyText
          ? bodyText + " " + instruction
          : instruction;
      }

      return NextResponse.json({
        ...scene,
        headline,
        subheadline,
        bodyText,
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
          {
            role: "system",
            content:
              SYSTEM_PROMPT +
              "\nYou are refining a single scene in a presentation deck. Return the full scene JSON with your improvements applied.",
          },
          {
            role: "user",
            content: `Refine this scene based on the instruction.

CURRENT SCENE:
${JSON.stringify(scene, null, 2)}

${context ? `DECK CONTEXT:\n${context}\n` : ""}

INSTRUCTION: ${instruction}

Return the complete refined scene as a JSON object with the same fields. Apply the instruction thoughtfully — don't change fields that weren't relevant to the instruction.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ ...scene, ...result });
  } catch (error) {
    console.error("Refine error:", error);
    return NextResponse.json(
      { error: "Failed to refine scene" },
      { status: 500 }
    );
  }
}
