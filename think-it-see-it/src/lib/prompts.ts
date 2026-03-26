// ============================================================
// THINK IT. SEE IT. — AI Prompt Templates
// Powered by the voice extraction research model
// ============================================================

export const SYSTEM_PROMPT = `You are a world-class creative strategist and presentation architect. You work at the intersection of brand strategy, storytelling, and visual communication. You think like a senior planner at a top advertising agency — structured, insightful, and creatively brave.

You understand the difference between:
- A BRIEF (what the client asked for) and a CHALLENGE (the deeper problem to solve)
- A DATA POINT (sales are down) and an INSIGHT (a human truth that unlocks the strategy)
- A PROPOSITION (the strategic thought) and a TAGLINE (the expression of it)
- A TONE ATTRIBUTE (bold, warm) and a TONAL REFERENCE (like Nike's voice, like a TED talk)

You extract structure from messy thinking. You find the signal in the noise.
Always respond with valid JSON.`;

export function analyzePrompt(text: string): string {
  return `You are extracting the strategic structure from raw, messy thinking. This input comes from a creative professional — it may be a voice transcript, a brain dump, meeting notes, or a pasted brief. Your job is to find the strategy hidden within.

RAW INPUT:
"""
${text}
"""

EXTRACTION INSTRUCTIONS:

1. BRIEF: What is the core task or ask? Look for "the brief is", "they want us to", "we need to". Use the most complete version. Must be a substantive statement (10+ words).

2. AUDIENCE: Who is the work for? Extract the primary audience. Listen for demographics, psychographics (values, attitudes), and behaviours (media habits, purchase patterns). Distinguish external audience (people seeing the work) from internal stakeholders (people approving it).

3. CHALLENGE: What is the core strategic challenge? Go deeper than symptoms ("sales are down") to root causes ("the brand is irrelevant to a new generation"). Look for "the problem is", "what's hard is", "the tension is".

4. INSIGHT: The core human, cultural, or market truth. This is NOT a data point — it's a revelation about human behaviour or cultural dynamics. Look for what the speaker gets most animated about. If not explicitly stated, synthesize one from available inputs and mark confidence as low.

5. OPPORTUNITY: The strategic opening the brand can own. Often framed as a gap: "nobody is doing", "the white space is".

6. PROPOSITION: The single organising thought. Tighter than a brief, more strategic than a tagline. Look for "the proposition is", "the positioning is".

7. MARKET CONTEXT: Category, named competitors, trends, overall category state (commoditized, growing, declining trust).

8. IDEA TERRITORIES: Any creative directions mentioned or implied. Label each with a name, description, and risk level (safe/moderate/bold).

9. TONE: Extract tone attributes (bold, warm, provocative), tonal references (brands, campaigns, cultural touchpoints), and tones to avoid.

10. CONSTRAINTS: Budget, timeline, required/excluded channels, legal limitations, brand sacred cows, stakeholder politics.

11. UNKNOWNS: Things not yet known — gaps, pending research, open questions. Listen for "I'm not sure", "TBD", "we need to find out".

12. DESIRED OUTCOME: What the speaker wants from THIS PRESENTATION specifically (get approval, align the team, win the pitch). Not campaign KPIs.

13. DECK TYPE: Infer the right deck type — pitch (competitive), strategy (alignment), campaign (launch), credentials (capability), innovation (new ventures), workshop (collaboration), case-study (proof), keynote (thought leadership).

14. CONFIDENCE: Score your confidence (0–1) for brief, audience, challenge, insight, proposition, and tone. Be honest — low confidence helps the user know what to review.

Return a JSON object with this structure:
{
  "brief": "The core brief in plain language",
  "audience": {
    "primary": "Primary target audience — be specific",
    "secondary": "Secondary audience if mentioned, or null",
    "demographics": "Age, gender, geography, income if mentioned",
    "psychographics": "Values, attitudes, beliefs, lifestyle",
    "behaviours": "Media habits, purchase patterns, cultural participation"
  },
  "challenge": "The core strategic challenge — go deep",
  "insight": "The human/cultural truth that unlocks the strategy, or null if not found",
  "opportunity": "The strategic opening the brand can own, or null",
  "proposition": "The core proposition, or null if not yet formed",
  "projectName": "Project name if mentioned, or null",
  "clientName": "Client/brand name if mentioned, or null",
  "problem": "Tactical problem if distinct from challenge, or null",
  "marketContext": {
    "category": "Market category",
    "competitors": ["Named competitors"],
    "trends": ["Market/cultural trends cited"],
    "categoryState": "Overall state of the category"
  },
  "ideaTerritories": [
    {
      "name": "Territory name",
      "description": "What this territory explores",
      "tone": "Tonal direction",
      "risk": "safe|moderate|bold"
    }
  ],
  "proof": ["Evidence, data points, or proof points mentioned"],
  "tone": {
    "attributes": ["3-5 tonal attributes"],
    "references": ["Brands or campaigns cited as tonal references"],
    "avoid": ["Tones to avoid"]
  },
  "constraints": {
    "budget": "Budget constraint or null",
    "timeline": "Timeline constraint or null",
    "channels": ["Required or mentioned channels"],
    "legal": "Legal constraints or null",
    "brand": "Brand constraints or null",
    "stakeholder": "Internal politics or null"
  },
  "unknowns": ["Things not yet known — gaps, pending research"],
  "desiredOutcome": "What this presentation needs to achieve",
  "deckType": "pitch|strategy|campaign|credentials|innovation|workshop|case-study|keynote",
  "confidence": {
    "brief": 0.9,
    "audience": 0.7,
    "challenge": 0.8,
    "insight": 0.5,
    "proposition": 0.3,
    "tone": 0.6
  },
  "rawSummary": "A clean 2-3 sentence summary of the thinking",
  "objective": "The core objective in one sentence (derived from brief)",
  "keyInsights": ["3-5 key insights — human truths, not data points"],
  "tensions": ["2-3 creative tensions or contradictions worth exploring"],
  "opportunities": ["2-3 strategic opportunities identified"]
}

CRITICAL RULES:
- An insight is NOT a data point. "Sales grew 20%" is data. "People buy more when they feel part of a community" is an insight.
- Extract the DEEPER challenge, not the surface symptom.
- If a field is not present in the input, return null — do not fabricate.
- Be conservative with confidence scores — it's better to flag uncertainty than to overstate.
- The "objective" field should be a one-sentence distillation of the brief.`;
}

export function storyShapesPrompt(extraction: string): string {
  return `Based on this strategic extraction, generate 3 distinct story shapes (narrative structures) that could frame this thinking into a compelling presentation.

STRATEGIC EXTRACTION:
${extraction}

STORY SHAPE KNOWLEDGE:
Strong presentation narratives follow proven arc patterns. Common shapes include:
- The Challenger Arc: Confront with uncomfortable truth → Build tension → Pivot to new way → Prove it → Ask
- The Cultural Wave: Start from culture → Zoom to category → Zoom to brand opportunity → Leap → Roadmap
- The Evidence Engine: Lead with data → Find pattern → Extract insight → Show implication → Reveal idea → Prove it works
- Hero's Journey: Status quo → Disruption → Struggle → Discovery → Transformation → New world
- Problem-Solution: State problem → Quantify impact → Reveal cause → Present solution → Show results
- Before-After: Current state → Pain points → Vision of future → Bridge to get there → Proof it's possible
- Tension-Release: Build tension → Compound it → Create discomfort → Release with insight → Resolve with idea

Consider the deck type when choosing shapes:
- Pitch decks: Challenger Arc and Evidence Engine work well (need to persuade)
- Strategy decks: Evidence Engine and Cultural Wave (need to prove)
- Campaign decks: Hero's Journey and Before-After (need to inspire)
- Workshop decks: Problem-Solution and Tension-Release (need to provoke discussion)

Return a JSON array of exactly 3 story shapes, each with this structure:
{
  "id": "shape-1",
  "name": "A memorable name for this narrative structure",
  "description": "2-3 sentences on what this shape does and why it works for THIS brief",
  "arc": ["4-7 stages of the narrative arc — name each stage evocatively"],
  "reasoning": "Why this shape fits this particular brief, audience, and desired outcome"
}

Make the shapes genuinely different — don't just rename the same structure. One should be confrontational, one aspirational, one evidence-led. Adapt the arc stage names to the specific brief content.`;
}

export function creativeRoutesPrompt(extraction: string, storyShape: string): string {
  return `You are generating creative routes for a presentation. A creative route is a distinct creative direction — a conceptual world, a visual language, a tonal approach — built on a story shape.

STRATEGIC EXTRACTION:
${extraction}

CHOSEN STORY SHAPE:
${storyShape}

CREATIVE ROUTE KNOWLEDGE:
A strong creative route has:
- A bold, memorable NAME that captures the essence
- A CONCEPT that could only work for this brand/brief (not generic)
- A VISUAL WORLD described specifically enough to brief a designer (colours, textures, photography style, typography feel, references)
- A TONAL REGISTER that's distinctive (not just "professional and modern")
- 6-8 SCENES that follow the story shape's arc

The three routes should vary on the RISK spectrum:
- Route 1: SAFE — strategically sound, visually polished, low risk. Would satisfy a conservative client.
- Route 2: MODERATE — creatively interesting, some unexpected angles, balanced risk.
- Route 3: BOLD — provocative, culturally brave, high impact. Could be the work that defines the brand.

Generate 3 distinct creative routes. Each should feel like it came from a different creative team.

Return a JSON array of exactly 3 creative routes:
{
  "id": "route-1",
  "name": "A bold, memorable name for this creative direction",
  "concept": "The core creative concept in 2-3 sentences — specific to THIS brief",
  "visualWorld": "Specific visual world — name colours, textures, photography style, typography feel, cultural/design references. Be specific enough to brief a designer.",
  "tonalRegister": "The voice and tone — use distinctive language, not generic. e.g. 'Like a smart friend who's always first to the trend' not 'Modern and approachable'",
  "storyShapeId": "the story shape id",
  "scenes": [{"title": "Scene title", "intent": "What this scene achieves in the narrative"}]
}

CRITICAL: Each route's scenes must follow the story shape's arc. Map each arc stage to 1-2 scenes.`;
}

export function generateDeckPrompt(
  extraction: string,
  route: string,
  format: "pitch" | "workshop"
): string {
  const formatGuidance =
    format === "pitch"
      ? `This is a PITCH DECK — concise, persuasive, visual-first.
- Headlines should ASSERT, not describe. "They Don't Trust You Yet" not "About Trust Issues"
- Body text: maximum 2 sentences per scene. If the headline says it, the body shouldn't repeat it.
- Every scene builds momentum toward the ask.
- Proof appears at key moments, not as a data dump.
- Budget and timeline come AFTER the idea has landed.
- End with a clear, confident ask.`
      : `This is a WORKSHOP DECK — exploratory, collaborative, thought-provoking.
- Include provocative questions that spark discussion.
- Leave white space — literally and conceptually.
- Mix informational scenes with interactive provocations.
- Speaker notes should include facilitation guidance ("Allow 5 minutes for table discussion").
- Add exercise/breakout scenes where appropriate.
- End with synthesis and clear next steps, not a hard sell.`;

  return `Generate a complete living deck from this creative route.

STRATEGIC EXTRACTION:
${extraction}

CREATIVE ROUTE:
${route}

FORMAT: ${format.toUpperCase()}
${formatGuidance}

SCENE QUALITY STANDARDS:
- Headlines: Short, bold, assertive. 3-8 words ideal. Make them memorable.
- Subheadlines: Support the headline, add nuance. Never repeat the headline.
- Body text: Tight. 1-3 sentences max. Every word earns its place.
- Visual direction: Specific enough to brief a designer. Describe the shot, the mood, the composition. Not "nice photo" — "Aerial view of a crowded market at golden hour, shallow depth of field, warm tones".
- Speaker notes: What to SAY and DO. Include pauses, emphasis, audience interaction cues.
- Scene types: Use the full range — title, insight, tension, idea, evidence, action, closing.

Return a JSON object:
{
  "title": "Deck title — memorable and specific to the creative route",
  "subtitle": "Deck subtitle — grounds the route in the brief",
  "scenes": [
    {
      "id": "scene-1",
      "order": 1,
      "headline": "Bold, compelling headline — assert, don't describe",
      "subheadline": "Supporting line that adds nuance",
      "bodyText": "1-3 sentences of tight body copy",
      "visualDirection": "Specific art direction — describe the visual world for this scene",
      "speakerNotes": "What the presenter should say and do — include pauses and emphasis cues",
      "sceneType": "title|insight|tension|idea|evidence|action|closing",
      "colorAccent": "A hex color that fits this scene's mood within the route's visual world"
    }
  ]
}

Generate 8-12 scenes following the creative route's scene structure. Every scene must have a clear purpose in the narrative. No filler. No generic scenes. Each headline should be something you've never read in a deck before.`;
}
