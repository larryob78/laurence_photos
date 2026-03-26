import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, analyzePrompt } from "@/lib/prompts";
import { generateJSON, isDemoMode } from "@/lib/ai-server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    if (isDemoMode()) {
      // Rich demo data for Toni's ad agency
      return NextResponse.json({
        brief: "Reposition the brand for a younger audience without alienating the loyal existing customer base, launching a new creative platform that works across digital, social, and experiential channels",
        audience: {
          primary: "Gen Z and young Millennials (18–28) who are culturally active, brand-skeptical, and value authenticity over polish",
          secondary: "Existing loyal customers (35–55) who need to see evolution, not revolution",
          demographics: "18–28, urban, digitally native, mid-to-high disposable income",
          psychographics: "Value self-expression over status. Distrust corporate language. Seek brands that 'get it' without trying too hard.",
          behaviours: "Discover brands through social and peer recommendation. Skip ads. Engage with culture-first content.",
        },
        challenge: "The brand is perceived as reliable but irrelevant by under-30s — it's trusted but not desired. Competitors have claimed the cultural conversation while this brand has been talking to itself.",
        insight: "People don't reject established brands because they're old — they reject them because they feel performed. Authenticity isn't about being new. It's about being honest.",
        opportunity: "No established brand in the category has successfully bridged the generational gap without a full rebrand. There's a first-mover advantage in proving that heritage and relevance can coexist.",
        proposition: "The brand that proves trust isn't boring — it's the ultimate flex.",
        projectName: "Brand Relevance Platform",
        clientName: null,
        problem: "Need a creative platform that launches in Q3 across 6 markets with a single idea that flexes locally",
        marketContext: {
          category: "Consumer lifestyle / premium everyday",
          competitors: ["Competitor A (owns 'innovation')", "Competitor B (owns 'sustainability')", "Competitor C (owns 'youth culture')"],
          trends: ["Anti-corporate sentiment in Gen Z", "Authenticity economy", "Creator-brand partnerships replacing traditional advertising", "Nostalgia cycles making heritage valuable again"],
          categoryState: "Commoditized on product, differentiated on culture. Every brand sounds the same in ads but the ones winning are the ones embedded in real cultural moments.",
        },
        ideaTerritories: [
          { name: "Earned, Not Given", description: "Position the brand's heritage as something earned through decades of real trust", tone: "Confident, understated, proof-led", risk: "safe" },
          { name: "The Uncomfortable Flex", description: "Lean into the brand's 'uncool' reputation and turn it into a badge of honour", tone: "Provocative, self-aware, culturally sharp", risk: "bold" },
          { name: "Culture Carriers", description: "Partner with creators who genuinely use and love the brand", tone: "Warm, human, documentary-feel", risk: "moderate" },
        ],
        proof: [
          "Brand trust scores are 40% higher than nearest competitor",
          "Heritage brands with authentic cultural strategies see 2.3x engagement (Kantar 2024)",
          "73% of Gen Z say they'd reconsider a brand their parents love if it showed up in culture authentically",
        ],
        tone: {
          attributes: ["Confident", "Culturally fluent", "Warm but not soft", "Self-aware"],
          references: ["Patagonia's quiet confidence", "Nike's cultural instinct", "Aesop's premium without pretension"],
          avoid: ["Corporate", "Preachy", "Trying-too-hard youth language", "Ironic detachment"],
        },
        constraints: {
          budget: "Mid-range — strong enough for hero content, not enough for mass TV",
          timeline: "Creative platform approved by end of Q2, campaign in market Q3",
          channels: ["Social-first", "Digital", "Experiential", "Some OOH"],
          legal: null,
          brand: "Logo and core brand mark cannot change. Everything else is open.",
          stakeholder: "CMO is progressive but the board is conservative. Need to show measured ambition.",
        },
        unknowns: [
          "Final media budget not confirmed",
          "Whether creator partnerships are approved at board level",
          "Competitor C is rumoured to be launching something similar in Q3",
        ],
        desiredOutcome: "Get the CMO and marketing leadership aligned on a creative platform direction, with approval to develop one route into full campaign",
        deckType: "pitch",
        confidence: { brief: 0.9, audience: 0.85, challenge: 0.9, insight: 0.75, proposition: 0.6, tone: 0.8 },
        rawSummary: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
        objective: "Reposition the brand for a younger audience with a new creative platform that bridges heritage and cultural relevance",
        keyInsights: [
          "People reject established brands not for being old, but for feeling performed",
          "Authenticity in this category means honesty about what you are, not pretending to be something new",
          "Heritage is becoming an asset in a world of disposable brands — if you use it right",
          "The audience discovers brands through culture, not advertising",
        ],
        tensions: [
          "The brand wants to be culturally relevant but the organization is structurally conservative",
          "The audience craves authenticity but also expects premium production quality",
          "Heritage is an asset and a liability simultaneously — trusted but not desired",
        ],
        opportunities: [
          "First established brand to authentically bridge the generational relevance gap",
          "Leverage existing trust as a foundation for cultural participation",
          "Build a creator-partnership model that turns the brand into a platform",
        ],
      });
    }

    const result = await generateJSON(SYSTEM_PROMPT, analyzePrompt(text), 0.7);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze input" }, { status: 500 });
  }
}
