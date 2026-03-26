// ============================================================
// THINK IT. SEE IT. — Core Type System
// Powered by research data foundation
// ============================================================

/** The pipeline stages a project moves through */
export type Stage =
  | "input"
  | "analyzing"
  | "story-shapes"
  | "creative-routes"
  | "generating-deck"
  | "deck";

/** All 8 deck types from agency_deck_structures.md */
export type DeckType =
  | "pitch"
  | "strategy"
  | "campaign"
  | "credentials"
  | "innovation"
  | "workshop"
  | "case-study"
  | "keynote";

/** All 24 scene types from scene_taxonomy.csv */
export type SceneType =
  | "cover"
  | "intro"
  | "overview"
  | "brief"
  | "challenge"
  | "audience"
  | "market_context"
  | "insight"
  | "strategy"
  | "opportunity"
  | "proposition"
  | "route_reveal"
  | "idea_board"
  | "execution"
  | "media_plan"
  | "timeline"
  | "production"
  | "budget"
  | "case_study"
  | "quote"
  | "results"
  | "provocation"
  | "exercise"
  | "divider"
  | "closing";

/** Layout types from dataset_schemas.json */
export type LayoutType =
  | "centred"
  | "split-left"
  | "split-right"
  | "full-bleed"
  | "editorial"
  | "grid"
  | "dashboard";

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
  brief: string;
  audience: AudienceProfile;
  challenge: string;
  insight?: string;
  opportunity?: string;
  proposition?: string;
  projectName?: string;
  clientName?: string;
  problem?: string;
  marketContext?: MarketContext;
  ideaTerritories?: IdeaTerritory[];
  proof?: string[];
  tone?: ToneDirection;
  constraints?: Constraints;
  unknowns?: string[];
  desiredOutcome?: string;
  deckType?: DeckType;
  confidence?: ExtractionConfidence;
  rawSummary: string;
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
  risk?: "safe" | "moderate" | "bold";
}

/** High-level scene outline before full deck generation */
export interface SceneOutline {
  title: string;
  intent: string;
}

/** Brand kit color */
export interface BrandColor {
  name: string;
  hex: string;
  usage?: string;
}

/** Brand kit for theming decks */
export interface BrandKit {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: BrandColor[];
    secondary: BrandColor[];
    neutral: BrandColor[];
  };
  typography: {
    headingFamily: string;
    bodyFamily: string;
    headlineStyle: string;
  };
  toneOfVoice: {
    personality: string[];
    weAre: string[];
    weAreNot: string[];
  };
  visualStyle: string;
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
  sceneType: SceneType;
  layout?: LayoutType;
  colorAccent: string;
}

/** The complete living deck */
export interface LivingDeck {
  id: string;
  title: string;
  subtitle: string;
  scenes: DeckScene[];
  creativeRouteId: string;
  deckType: DeckType;
  format: "pitch" | "workshop";
  brandKitId?: string;
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
  selectedBrandKitId: string | null;
  deck: LivingDeck | null;
}
