// ============================================================
// THINK IT. SEE IT. — AI Prompt Templates
// ============================================================

export const SYSTEM_PROMPT = `You are a world-class creative strategist and presentation architect. You work at the intersection of brand strategy, storytelling, and visual communication. You think like a senior planner at a top advertising agency — structured, insightful, and creatively brave. Always respond with valid JSON.`;

export function analyzePrompt(text: string): string {
  return `Analyze this raw thinking from a creative professional. Extract the strategic structure hidden within the messy input.

RAW INPUT:
"""
${text}
"""

Return a JSON object with exactly this shape:
{
  "objective": "The core objective or brief in one sentence",
  "audience": "Who this is for — be specific",
  "keyInsights": ["3-5 key insights extracted from the thinking"],
  "tensions": ["2-3 creative tensions or contradictions worth exploring"],
  "opportunities": ["2-3 strategic opportunities identified"],
  "tone": "The tonal direction suggested by the input",
  "rawSummary": "A clean 2-3 sentence summary of the thinking"
}`;
}

export function storyShapesPrompt(extraction: string): string {
  return `Based on this strategic extraction, generate 3 distinct story shapes (narrative structures) that could frame this thinking into a compelling presentation.

STRATEGIC EXTRACTION:
${extraction}

Return a JSON array of exactly 3 story shapes, each with this structure:
{
  "id": "shape-1",
  "name": "A memorable name for this narrative structure",
  "description": "2-3 sentences on what this shape does and why it works",
  "arc": ["4-6 stages of the narrative arc, e.g. 'The World As It Is', 'The Uncomfortable Truth', 'The Shift', 'The New Way', 'The Proof', 'The Ask'"],
  "reasoning": "Why this shape fits this particular brief"
}

Make the shapes genuinely different — don't just rename the same structure. Think: one could be confrontational, one aspirational, one evidence-led.`;
}

export function creativeRoutesPrompt(extraction: string, storyShape: string): string {
  return `You are generating creative routes for a presentation. A creative route is a distinct creative direction — a conceptual world, a visual language, a tonal approach — built on a story shape.

STRATEGIC EXTRACTION:
${extraction}

CHOSEN STORY SHAPE:
${storyShape}

Generate 3 distinct creative routes. Each should feel like it could come from a different creative team. Make them genuinely different in concept, visual world, and tone.

Return a JSON array of exactly 3 creative routes:
{
  "id": "route-1",
  "name": "A bold, memorable name for this creative direction",
  "concept": "The core creative concept in 2-3 sentences",
  "visualWorld": "Description of the visual world — colors, textures, references, mood",
  "tonalRegister": "The voice and tone — e.g. 'Provocative and direct' or 'Warm and conspiratorial'",
  "storyShapeId": "the story shape id",
  "scenes": [{"title": "Scene title", "intent": "What this scene achieves"}]
}

Each route should have 6-8 scenes that follow the story shape's arc.`;
}

export function generateDeckPrompt(
  extraction: string,
  route: string,
  format: "pitch" | "workshop"
): string {
  const formatGuidance =
    format === "pitch"
      ? "This is a PITCH DECK — concise, persuasive, visual-first. Headlines should sell. Body text should be minimal. Every scene should build momentum toward the ask."
      : "This is a WORKSHOP DECK — exploratory, collaborative, thought-provoking. Include questions and provocations. Leave space for discussion. Balance information with interaction.";

  return `Generate a complete living deck from this creative route.

STRATEGIC EXTRACTION:
${extraction}

CREATIVE ROUTE:
${route}

FORMAT: ${format.toUpperCase()}
${formatGuidance}

Return a JSON object:
{
  "title": "Deck title",
  "subtitle": "Deck subtitle",
  "scenes": [
    {
      "id": "scene-1",
      "order": 1,
      "headline": "Bold, compelling headline",
      "subheadline": "Supporting line",
      "bodyText": "1-3 sentences of body copy. Keep it tight.",
      "visualDirection": "Art direction notes for this scene — describe the visual world",
      "speakerNotes": "What the presenter should say/do here",
      "sceneType": "title|insight|tension|idea|evidence|action|closing",
      "colorAccent": "A hex color that fits this scene's mood"
    }
  ]
}

Generate 8-12 scenes that follow the creative route's scene structure. Make each scene purposeful — no filler.`;
}
