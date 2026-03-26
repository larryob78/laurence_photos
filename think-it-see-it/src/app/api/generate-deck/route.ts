import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, generateDeckPrompt } from "@/lib/prompts";
import { generateJSON, isDemoMode } from "@/lib/ai-server";
import type { SceneType, DeckType, BrandKit } from "@/lib/types";
import { DECK_TYPE_SCENES, getSceneInfo } from "@/lib/scene-taxonomy";

export async function POST(req: Request) {
  try {
    const { extraction, route, format = "pitch", deckType = "pitch", brandKit } = await req.json();
    if (!extraction || !route) {
      return NextResponse.json({ error: "extraction and route are required" }, { status: 400 });
    }

    if (isDemoMode()) {
      const sceneSequence = DECK_TYPE_SCENES[(deckType as DeckType) || "pitch"];
      const routeScenes = route.scenes || [];
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

      const scenes = sceneSequence.map((sceneType: SceneType, i: number) => {
        const info = getSceneInfo(sceneType);
        const routeScene = routeScenes[i] || routeScenes[routeScenes.length - 1];

        const workshopNotes: Record<string, string> = {
          insight: "Take 2 minutes. Discuss with your table: does this match what you see in the market?",
          strategy: "Before we reveal our direction — what strategic territories do you see?",
          execution: "Which of these executions would you prioritise? Vote with your dots.",
          closing: "We'll share the full deck and next steps by EOD Friday.",
        };
        const workshopNote = format === "workshop" ? workshopNotes[sceneType] : undefined;

        return {
          id: `scene-${i + 1}`,
          order: i + 1,
          headline: routeScene?.title || headlines[sceneType] || info.label,
          subheadline: routeScene?.intent || info.purpose,
          bodyText: bodyTexts[sceneType] || (format === "workshop"
            ? "Take a moment to discuss this with your team."
            : ""),
          visualDirection: bk
            ? `${bk.visualStyle}. Scene mood: ${info.label.toLowerCase()}.`
            : `${route.visualWorld || "Clean, modern visual approach"}. Scene type: ${info.label.toLowerCase()}.`,
          speakerNotes: workshopNote || `${info.purpose}. ${routeScene?.intent || ""}`.trim(),
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

    // Live AI mode
    const brandKitContext = brandKit
      ? `\n\nBRAND KIT: ${brandKit.name}\nVisual Style: ${brandKit.visualStyle}\nTone: ${brandKit.toneOfVoice.personality.join(", ")}\nWe are: ${brandKit.toneOfVoice.weAre.join(", ")}\nWe are not: ${brandKit.toneOfVoice.weAreNot.join(", ")}\nHeadline style: ${brandKit.typography.headlineStyle}\nPrimary colours: ${brandKit.colors.primary.map((c: { name: string; hex: string }) => `${c.name} (${c.hex})`).join(", ")}\n\nApply this brand kit throughout.`
      : "";

    const result = await generateJSON(
      SYSTEM_PROMPT,
      generateDeckPrompt(JSON.stringify(extraction), JSON.stringify(route), format) + brandKitContext,
      0.7
    );

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
    return NextResponse.json({ error: "Failed to generate deck" }, { status: 500 });
  }
}
