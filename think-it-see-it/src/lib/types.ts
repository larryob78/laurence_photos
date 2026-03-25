// ============================================================
// THINK IT. SEE IT. — Core Type System
// ============================================================

/** The pipeline stages a project moves through */
export type Stage =
  | "input"
  | "analyzing"
  | "story-shapes"
  | "creative-routes"
  | "generating-deck"
  | "deck";

/** Raw input from the user — voice or text */
export interface RawInput {
  text: string;
  source: "voice" | "text";
  timestamp: number;
}

/** Audience profile extracted from input */
export interface AudienceProfile {
  primary: string;
  secondary?: string;
  demographics?: string;
  psychographics?: string;
  behaviours?: string;
}

/** Market context extracted from input */
export interface MarketContext {
  category?: string;
  competitors?: string[];
  trends?: string[];
  categoryState?: string;
}

/** Constraints on the work */
export interface Constraints {
  budget?: string;
  timeline?: string;
  channels?: string[];
  legal?: string;
  brand?: string;
  stakeholder?: string;
  other?: string[];
}

/** Tone direction */
export interface ToneDirection {
  attributes: string[];
  references?: string[];
  avoid?: string[];
}

/** Idea territory floated in the input */
export interface IdeaTerritory {
  name: string;
  description: string;
  tone?: string;
  risk?: "safe" | "moderate" | "bold";
}

/** Per-field extraction confidence */
export interface ExtractionConfidence {
  brief: number;
  audience: number;
  challenge: number;
  insight: number;
  proposition: number;
  tone: number;
}

/** Strategic structure extracted from raw input — deep extraction model */
export interface StrategicExtraction {
  // Core fields (required)
  brief: string;
  audience: AudienceProfile;
  challenge: string;

  // Strategic fields
  insight?: string;
  opportunity?: string;
  proposition?: string;

  // Context fields
  projectName?: string;
  clientName?: string;
  problem?: string;
  marketContext?: MarketContext;

  // Creative direction
  ideaTerritories?: IdeaTerritory[];
  proof?: string[];
  tone?: ToneDirection;

  // Constraints and unknowns
  constraints?: Constraints;
  unknowns?: string[];

  // Meta
  desiredOutcome?: string;
  deckType?: "pitch" | "strategy" | "campaign" | "credentials" | "innovation" | "workshop" | "case-study" | "keynote";
  confidence?: ExtractionConfidence;
  rawSummary: string;

  // Legacy compat — flattened views for simpler UI rendering
  objective: string;
  keyInsights: string[];
  tensions: string[];
  opportunities: string[];
}

/** A narrative structure template */
export interface StoryShape {
  id: string;
  name: string;
  description: string;
  arc: string[];
  reasoning: string;
}

/** A creative direction built on a story shape */
export interface CreativeRoute {
  id: string;
  name: string;
  concept: string;
  visualWorld: string;
  tonalRegister: string;
  storyShapeId: string;
  scenes: SceneOutline[];
}

/** High-level scene outline before full deck generation */
export interface SceneOutline {
  title: string;
  intent: string;
}

/** A fully realized scene in a living deck */
export interface DeckScene {
  id: string;
  order: number;
  headline: string;
  subheadline: string;
  bodyText: string;
  visualDirection: string;
  speakerNotes: string;
  sceneType: "title" | "insight" | "tension" | "idea" | "evidence" | "action" | "closing";
  colorAccent: string;
}

/** The complete living deck */
export interface LivingDeck {
  id: string;
  title: string;
  subtitle: string;
  scenes: DeckScene[];
  creativeRouteId: string;
  format: "pitch" | "workshop";
  createdAt: number;
  updatedAt: number;
}

/** The complete project state */
export interface Project {
  id: string;
  stage: Stage;
  rawInput: RawInput | null;
  extraction: StrategicExtraction | null;
  storyShapes: StoryShape[];
  selectedStoryShapeId: string | null;
  creativeRoutes: CreativeRoute[];
  selectedCreativeRouteId: string | null;
  deck: LivingDeck | null;
}
