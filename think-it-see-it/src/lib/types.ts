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

/** Strategic structure extracted from raw input */
export interface StrategicExtraction {
  objective: string;
  audience: string;
  keyInsights: string[];
  tensions: string[];
  opportunities: string[];
  tone: string;
  rawSummary: string;
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
