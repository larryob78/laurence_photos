import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, generateDeckPrompt } from "@/lib/prompts";
import type { SceneType, DeckType, BrandKit } from "@/lib/types";
import { DECK_TYPE_SCENES, getSceneInfo } from "@/lib/scene-taxonomy";

export async function POST(req: Request) {
  try {
    const { extraction, route, format = "pitch", deckType = "pitch", brandKit } = await req.json();
    if (!extraction || !route) {
      return NextResponse.json({ error: "extraction and route are required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Use scene taxonomy to generate research-informed scenes
      const sceneSequence = DECK_TYPE_SCENES[(deckType as DeckType) || "pitch"];
      const routeScenes = route.scenes || [];

      // Merge route's creative scenes with the deck type's structural sequence
      const scenes = sceneSequence.map((sceneType: SceneType, i: number) => {
        const info = getSceneInfo(sceneType);
        const routeScene = routeScenes[i] || routeScenes[routeScenes.length - 1];

        // Brand kit influence on colours
        const bk = brandKit as BrandKit | null;
        const accentColors = bk
          ? [...bk.colors.primary.map((c: { hex: string }) => c.hex), ...bk.colors.secondary.map((c: { hex: string }) => c.hex)]
          : ["#FF3366", "#6C5CE7", "#00B894", "#FDCB6E", "#E17055", "#0984E3", "#00CEC9", "#E84393"];

        const headlines: Record<string, string> = {
          cover: route.name || "Untitled",
          intro: "Why We're Here",
          overview: "What We'll Cover",
          brief: "The Brief, As We Heard It",
          challenge: extraction.challenge || "The Challenge",
          audience: typeof extraction.audience === "object" ? `Meet: ${extraction.audience.primary?.split(" ").slice(0, 4).join(" ")}` : "The Audience",
          market_context: extraction.marketContext?.categoryState || "The Landscape",
          insight: extraction.insight || "The Uncomfortable Truth",
          strategy: extraction.proposition || "The Strategic Framework",
          opportunity: extraction.opportunity || "The White Space",
          proposition: extraction.proposition || "The Proposition",
          route_reveal: route.name,
          idea_board: `${route.name}: The Idea`,
          execution: "How It Lives",
          media_plan: "Where It Shows Up",
          timeline: "The Road Ahead",
          production: "How We Make It",
          budget: "The Investment",
          case_study: "Proof It Works",
          quote: extraction.insight ? `"${extraction.insight.split(".")[0]}."` : "In Their Words",
          results: "The Numbers That Matter",
          provocation: "What If Everything You Knew Was Wrong?",
          exercise: "Over To You",
          divider: "—",
          closing: "Let's Make This Real",
        };

        const bodyTexts: Record<string, string> = {
          cover: route.concept?.slice(0, 100) || "",
          brief: extraction.brief || "",
          challenge: typeof extraction.audience === "object" ? `For ${extraction.audience.primary}, the gap between expectation and reality is growing.` : "",
          insight: "This is not a data point. This is a human truth that changes how we think about the entire category.",
          strategy: extraction.opportunities?.[0] || "A framework for owning the conversation.",
          proposition: extraction.desiredOutcome || "",
          route_reveal: route.concept || "",
          idea_board: route.visualWorld || "",
          execution: "From social to experiential, the idea flexes without breaking.",
          closing: extraction.desiredOutcome || "The opportunity is clear. The strategy is sound. The creative is ready. Let's go.",
        };

        const workshopOverrides: Record<string, string> = {
          insight: "Take 2 minutes. Discuss with your table: does this match what you see in the market?",
          strategy: "Before we reveal our direction — what strategic territories do you see? (5 min exercise)",
          execution: "Which of these executions would you prioritise? Vote with your dots.",
          closing: "We'll share the full deck and next steps by EOD Friday. Three things to take away today:",
        };

        const speakerNotes = format === "workshop" && workshopOverrides[sceneType]
          ? workshopOverrides[sceneType]
          : `${info.purpose}. ${routeScene?.intent || "Advance the narrative."}`;

        return {
          id: `scene-${i + 1}`,
          order: i + 1,
          headline: routeScene?.title || headlines[sceneType] || info.label,
          subheadline: routeScene?.intent || info.purpose,
          bodyText: bodyTexts[sceneType] || (format === "workshop"
            ? "Take a moment to discuss this with your team. What resonates? What challenges your thinking?"
            : ""),
          visualDirection: bk
            ? `${bk.visualStyle}. Scene mood: ${info.label.toLowerCase()}.`
            : `${route.visualWorld || "Clean, modern visual approach"}. Scene type: ${info.label.toLowerCase()}.`,
          speakerNotes,
          sceneType,
          layout: info.defaultLayout,
          colorAccent: accentColors[i % accentColors.length],
        };
      });

      return NextResponse.json({
        id: "deck-" + Date.now(),
        title: route.name || "Untitled Deck",
        subtitle: route.concept?.slice(0, 100) || "A living presentation",
        scenes,
        creativeRouteId: route.id,
        deckType,
        format,
        brandKitId: brandKit?.id || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // With API key — include brand kit in the prompt
    const brandKitContext = brandKit
      ? `\n\nBRAND KIT: ${brandKit.name}
Visual Style: ${brandKit.visualStyle}
Tone: ${brandKit.toneOfVoice.personality.join(", ")}
We are: ${brandKit.toneOfVoice.weAre.join(", ")}
We are not: ${brandKit.toneOfVoice.weAreNot.join(", ")}
Headline style: ${brandKit.typography.headlineStyle}
Primary colours: ${brandKit.colors.primary.map((c: { name: string; hex: string }) => `${c.name} (${c.hex})`).join(", ")}
Secondary colours: ${brandKit.colors.secondary.map((c: { name: string; hex: string }) => `${c.name} (${c.hex})`).join(", ")}

Apply this brand kit's visual style, tone, and colour palette throughout the deck. Use the brand colours for colorAccent values.`
      : "";

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
            ) + brandKitContext,
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
      deckType,
      format,
      brandKitId: brandKit?.id || null,
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
