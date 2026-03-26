import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Project,
  Stage,
  RawInput,
  StrategicExtraction,
  StoryShape,
  CreativeRoute,
  LivingDeck,
  DeckScene,
  SceneType,
} from "@/lib/types";

function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================================
// Edit Trace System — captures every edit for the product moat
// ============================================================

export interface EditTrace {
  id: string;
  action:
    | "create"
    | "edit-field"
    | "reorder"
    | "add-scene"
    | "remove-scene"
    | "change-format"
    | "ai-regenerate"
    | "select-shape"
    | "select-route"
    | "select-brand-kit"
    | "refine-deck";
  sceneId?: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: number;
}

// ============================================================
// Project Store
// ============================================================

interface ProjectStore extends Project {
  editTraces: EditTrace[];

  setStage: (stage: Stage) => void;
  setRawInput: (input: RawInput) => void;
  setExtraction: (extraction: StrategicExtraction) => void;
  updateExtraction: (updates: Partial<StrategicExtraction>) => void;
  setStoryShapes: (shapes: StoryShape[]) => void;
  selectStoryShape: (id: string) => void;
  setCreativeRoutes: (routes: CreativeRoute[]) => void;
  selectCreativeRoute: (id: string) => void;
  selectBrandKit: (id: string | null) => void;
  setDeck: (deck: LivingDeck) => void;
  updateScene: (sceneId: string, updates: Partial<DeckScene>) => void;
  deleteScene: (sceneId: string) => void;
  addScene: (afterSceneId: string | null, sceneType: SceneType) => void;
  reorderScenes: (sceneIds: string[]) => void;
  updateSceneFromAI: (sceneId: string, scene: Partial<DeckScene>) => void;
  setDeckFormat: (format: "pitch" | "workshop") => void;
  reset: () => void;
}

const initialState: Project = {
  id: "",
  stage: "input",
  rawInput: null,
  extraction: null,
  storyShapes: [],
  selectedStoryShapeId: null,
  creativeRoutes: [],
  selectedCreativeRouteId: null,
  selectedBrandKitId: null,
  deck: null,
};

function trace(
  set: (fn: (state: ProjectStore) => Partial<ProjectStore>) => void,
  action: EditTrace["action"],
  details?: Partial<EditTrace>
) {
  set((state) => ({
    editTraces: [
      ...state.editTraces,
      {
        id: createId(),
        action,
        timestamp: Date.now(),
        ...details,
      },
    ],
  }));
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      ...initialState,
      id: createId(),
      editTraces: [],

      setStage: (stage) => set({ stage }),
      setRawInput: (input) => set({ rawInput: input }),
      setExtraction: (extraction) => set({ extraction }),

      updateExtraction: (updates) =>
        set((state) => {
          if (!state.extraction) return state;
          return { extraction: { ...state.extraction, ...updates } };
        }),

      setStoryShapes: (shapes) => set({ storyShapes: shapes }),

      selectStoryShape: (id) => {
        set({ selectedStoryShapeId: id });
        trace(set, "select-shape", { newValue: id });
      },

      setCreativeRoutes: (routes) => set({ creativeRoutes: routes }),

      selectCreativeRoute: (id) => {
        set({ selectedCreativeRouteId: id });
        trace(set, "select-route", { newValue: id });
      },

      selectBrandKit: (id) => {
        set({ selectedBrandKitId: id });
        trace(set, "select-brand-kit", { newValue: id || undefined });
      },

      setDeck: (deck) => {
        set({ deck });
        trace(set, "create");
      },

      updateScene: (sceneId, updates) =>
        set((state) => {
          if (!state.deck) return state;
          const oldScene = state.deck.scenes.find((s) => s.id === sceneId);
          const changedField = Object.keys(updates)[0];
          return {
            deck: {
              ...state.deck,
              updatedAt: Date.now(),
              scenes: state.deck.scenes.map((s) =>
                s.id === sceneId ? { ...s, ...updates } : s
              ),
            },
            editTraces: [
              ...state.editTraces,
              {
                id: createId(),
                action: "edit-field" as const,
                sceneId,
                field: changedField,
                previousValue: oldScene ? String((oldScene as unknown as Record<string, unknown>)[changedField] || "") : undefined,
                newValue: String((updates as unknown as Record<string, unknown>)[changedField] || ""),
                timestamp: Date.now(),
              },
            ],
          };
        }),

      deleteScene: (sceneId) =>
        set((state) => {
          if (!state.deck) return state;
          return {
            deck: {
              ...state.deck,
              updatedAt: Date.now(),
              scenes: state.deck.scenes
                .filter((s) => s.id !== sceneId)
                .map((s, i) => ({ ...s, order: i + 1 })),
            },
            editTraces: [
              ...state.editTraces,
              { id: createId(), action: "remove-scene" as const, sceneId, timestamp: Date.now() },
            ],
          };
        }),

      addScene: (afterSceneId, sceneType) =>
        set((state) => {
          if (!state.deck) return state;
          const newScene: DeckScene = {
            id: `scene-${createId()}`,
            order: 0,
            headline: "New Scene",
            subheadline: "Edit this scene",
            bodyText: "",
            visualDirection: "",
            speakerNotes: "",
            sceneType,
            colorAccent: "#6C5CE7",
          };
          const scenes = [...state.deck.scenes];
          if (afterSceneId) {
            const idx = scenes.findIndex((s) => s.id === afterSceneId);
            scenes.splice(idx + 1, 0, newScene);
          } else {
            scenes.push(newScene);
          }
          return {
            deck: {
              ...state.deck,
              updatedAt: Date.now(),
              scenes: scenes.map((s, i) => ({ ...s, order: i + 1 })),
            },
            editTraces: [
              ...state.editTraces,
              { id: createId(), action: "add-scene" as const, sceneId: newScene.id, newValue: sceneType, timestamp: Date.now() },
            ],
          };
        }),

      reorderScenes: (sceneIds) =>
        set((state) => {
          if (!state.deck) return state;
          const sceneMap = new Map(state.deck.scenes.map((s) => [s.id, s]));
          const reordered = sceneIds
            .map((id) => sceneMap.get(id))
            .filter(Boolean) as DeckScene[];
          return {
            deck: {
              ...state.deck,
              updatedAt: Date.now(),
              scenes: reordered.map((s, i) => ({ ...s, order: i + 1 })),
            },
            editTraces: [
              ...state.editTraces,
              { id: createId(), action: "reorder" as const, timestamp: Date.now() },
            ],
          };
        }),

      updateSceneFromAI: (sceneId, scene) =>
        set((state) => {
          if (!state.deck) return state;
          return {
            deck: {
              ...state.deck,
              updatedAt: Date.now(),
              scenes: state.deck.scenes.map((s) =>
                s.id === sceneId ? { ...s, ...scene } : s
              ),
            },
            editTraces: [
              ...state.editTraces,
              { id: createId(), action: "ai-regenerate" as const, sceneId, timestamp: Date.now() },
            ],
          };
        }),

      setDeckFormat: (format) => {
        set((state) => {
          if (!state.deck) return state;
          return {
            deck: { ...state.deck, format, updatedAt: Date.now() },
          };
        });
        trace(set, "change-format", { newValue: format });
      },

      reset: () => set({ ...initialState, id: createId(), editTraces: [] }),
    }),
    {
      name: "think-it-see-it-project",
      partialize: (state) => ({
        id: state.id,
        stage: state.stage,
        rawInput: state.rawInput,
        extraction: state.extraction,
        storyShapes: state.storyShapes,
        selectedStoryShapeId: state.selectedStoryShapeId,
        creativeRoutes: state.creativeRoutes,
        selectedCreativeRouteId: state.selectedCreativeRouteId,
        selectedBrandKitId: state.selectedBrandKitId,
        deck: state.deck,
        editTraces: state.editTraces,
      }),
    }
  )
);

// ============================================================
// Multi-Project Store
// ============================================================

export interface ProjectSummary {
  id: string;
  name: string;
  deckType?: string;
  stage: Stage;
  sceneCount: number;
  createdAt: number;
  updatedAt: number;
}

interface ProjectListStore {
  projects: ProjectSummary[];
  activeProjectId: string | null;
  addProject: (summary: ProjectSummary) => void;
  updateProject: (id: string, updates: Partial<ProjectSummary>) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
}

export const useProjectListStore = create<ProjectListStore>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      addProject: (summary) =>
        set((state) => ({
          projects: [...state.projects, summary],
          activeProjectId: summary.id,
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId:
            state.activeProjectId === id ? null : state.activeProjectId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    { name: "think-it-see-it-projects" }
  )
);
