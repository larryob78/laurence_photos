import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, creativeRoutesPrompt } from "@/lib/prompts";
import { generateJSON, isDemoMode } from "@/lib/ai-server";

export async function POST(req: Request) {
  try {
    const { extraction, storyShape } = await req.json();
    if (!extraction || !storyShape) {
      return NextResponse.json({ error: "extraction and storyShape are required" }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json([
        {
          id: "route-1",
          name: "Burn The Playbook",
          risk: "bold",
          concept: "A provocative creative direction that literally tears apart category conventions. Every scene deconstructs a 'rule' and replaces it with a bolder truth. The visual world is raw, editorial, and unapologetic.",
          visualWorld: "High-contrast black and white with flashes of neon. Torn paper textures. Bold sans-serif type that breaks the grid. Photography is candid and imperfect.",
          tonalRegister: "Provocative and direct — like a manifesto written on a wall",
          storyShapeId: storyShape.id,
          scenes: [
            { title: "The Rule Book", intent: "Show the tired category conventions everyone follows" },
            { title: "The Cost of Conformity", intent: "Reveal what playing safe is actually costing" },
            { title: "The Tear", intent: "The dramatic moment of breaking from convention" },
            { title: "The New Rules", intent: "Introduce the bold new positioning" },
            { title: "What It Looks Like", intent: "Show the creative executions" },
            { title: "The Proof", intent: "Evidence this approach works" },
            { title: "The Ask", intent: "Clear call to action" },
          ],
        },
        {
          id: "route-2",
          name: "The Quiet Revolution",
          risk: "safe",
          concept: "While competitors shout, this brand whispers. A creative direction built on confidence, understatement, and cultural sophistication. Lets the work speak for itself.",
          visualWorld: "Muted earth tones with moments of deep color. Generous white space. Elegant serif typography. Photography feels cinematic and considered — like stills from an art film.",
          tonalRegister: "Warm and conspiratorial — like sharing a secret with a smart friend",
          storyShapeId: storyShape.id,
          scenes: [
            { title: "The Noise", intent: "Show the overwhelming sameness of the category" },
            { title: "The Whisper", intent: "Introduce a different frequency" },
            { title: "The Truth Beneath", intent: "Reveal the deeper consumer insight" },
            { title: "The Quiet Idea", intent: "Present the creative concept" },
            { title: "How It Lives", intent: "Show executions across channels" },
            { title: "The Ripple Effect", intent: "Demonstrate potential cultural impact" },
            { title: "Let's Begin", intent: "Invitation to collaborate" },
          ],
        },
        {
          id: "route-3",
          name: "Culture First",
          risk: "moderate",
          concept: "A creative direction that starts from culture and works inward. The brand becomes a cultural participant rather than an advertiser. Content-first, community-driven, always relevant.",
          visualWorld: "Vibrant, saturated colors. Mixed media — photography, illustration, user-generated content. Typography that feels social-native. Grid-breaking layouts that feel alive.",
          tonalRegister: "Culturally fluent and energetic — like a smart friend who's always first to the trend",
          storyShapeId: storyShape.id,
          scenes: [
            { title: "The Cultural Pulse", intent: "Show what's happening right now" },
            { title: "The Disconnect", intent: "Show how brands are missing the moment" },
            { title: "The Consumer Truth", intent: "What people actually want from brands" },
            { title: "Culture First Thinking", intent: "Introduce the strategic framework" },
            { title: "The Creative Platform", intent: "The big creative idea" },
            { title: "In The Wild", intent: "Show how it lives in culture" },
            { title: "The Community Effect", intent: "Show the flywheel of community engagement" },
            { title: "The Invitation", intent: "Join the movement" },
          ],
        },
      ]);
    }

    const result = await generateJSON(
      SYSTEM_PROMPT + "\nReturn your response as a JSON object with a 'routes' array.",
      creativeRoutesPrompt(JSON.stringify(extraction), JSON.stringify(storyShape)),
      0.9
    );
    return NextResponse.json((result as { routes?: unknown[] }).routes || result);
  } catch (error) {
    console.error("Creative routes error:", error);
    return NextResponse.json({ error: "Failed to generate creative routes" }, { status: 500 });
  }
}
