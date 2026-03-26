import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { generateJSON, isDemoMode } from "@/lib/ai-server";

export async function POST(req: Request) {
  try {
    const { scene, instruction, context } = await req.json();
    if (!scene || !instruction) {
      return NextResponse.json({ error: "scene and instruction are required" }, { status: 400 });
    }

    if (isDemoMode()) {
      const lower = instruction.toLowerCase();
      let headline = scene.headline;
      let bodyText = scene.bodyText;
      const subheadline = scene.subheadline;

      if (lower.includes("shorter") || lower.includes("concise")) {
        headline = headline.split(" ").slice(0, 5).join(" ");
        bodyText = bodyText ? bodyText.split(". ")[0] + "." : "";
      } else if (lower.includes("bolder") || lower.includes("provocative")) {
        headline = headline.toUpperCase();
        if (!headline.endsWith(".")) headline += ".";
      } else if (lower.includes("question")) {
        headline = headline.replace(/\.$/, "?");
        if (!headline.endsWith("?")) headline += "?";
      } else {
        headline = headline.replace(/^The /, "THE ");
        bodyText = bodyText ? bodyText + " " + instruction : instruction;
      }

      return NextResponse.json({ ...scene, headline, subheadline, bodyText });
    }

    const result = await generateJSON(
      SYSTEM_PROMPT + "\nYou are refining a single scene in a presentation deck. Return the full scene JSON with your improvements applied.",
      `Refine this scene based on the instruction.

CURRENT SCENE:
${JSON.stringify(scene, null, 2)}

${context ? `DECK CONTEXT:\n${context}\n` : ""}

INSTRUCTION: ${instruction}

Return the complete refined scene as JSON. Apply the instruction thoughtfully — only change fields relevant to the instruction.`,
      0.7
    );

    return NextResponse.json({ ...scene, ...result });
  } catch (error) {
    console.error("Refine error:", error);
    return NextResponse.json({ error: "Failed to refine scene" }, { status: 500 });
  }
}
