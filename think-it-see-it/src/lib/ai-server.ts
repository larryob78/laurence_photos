// ============================================================
// THINK IT. SEE IT. — Server-side AI Client
// Supports Claude (Anthropic) and OpenAI
// Defaults to Claude when ANTHROPIC_API_KEY is set
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

type AIProvider = "anthropic" | "openai" | "demo";

function getProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "demo";
}

export async function generateJSON(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7
): Promise<Record<string, unknown>> {
  const provider = getProvider();

  if (provider === "demo") {
    throw new Error("DEMO_MODE");
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      temperature,
      system: systemPrompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no commentary.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip any markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return JSON.parse(cleaned);
  }

  // OpenAI fallback
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export function isDemoMode(): boolean {
  return getProvider() === "demo";
}

export function getProviderName(): string {
  return getProvider();
}
