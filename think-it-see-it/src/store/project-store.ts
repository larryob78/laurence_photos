"use client";

import { create } from "zustand";
import type {
  Project,
  Stage,
  RawInput,
  StrategicExtraction,
  StoryShape,
  CreativeRoute,
  LivingDeck,
  DeckScene,
} from "@/lib/types";

function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface ProjectStore extends Project {
  // Actions
  setStage: (stage: Stage) => void;
  setRawInput: (input: RawInput) => void;
  setExtraction: (extraction: StrategicExtraction) => void;
  setStoryShapes: (shapes: StoryShape[]) => void;
  selectStoryShape: (id: string) => void;
  setCreativeRoutes: (routes: CreativeRoute[]) => void;
  selectCreativeRoute: (id: string) => void;
  setDeck: (deck: LivingDeck) => void;
  updateScene: (sceneId: string, updates: Partial<DeckScene>) => void;
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
  deck: null,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...initialState,
  id: createId(),

  setStage: (stage) => set({ stage }),

  setRawInput: (input) => set({ rawInput: input }),

  setExtraction: (extraction) => set({ extraction }),

  setStoryShapes: (shapes) => set({ storyShapes: shapes }),

  selectStoryShape: (id) => set({ selectedStoryShapeId: id }),

  setCreativeRoutes: (routes) => set({ creativeRoutes: routes }),

  selectCreativeRoute: (id) => set({ selectedCreativeRouteId: id }),

  setDeck: (deck) => set({ deck }),

  updateScene: (sceneId, updates) =>
    set((state) => {
      if (!state.deck) return state;
      return {
        deck: {
          ...state.deck,
          updatedAt: Date.now(),
          scenes: state.deck.scenes.map((s) =>
            s.id === sceneId ? { ...s, ...updates } : s
          ),
        },
      };
    }),

  setDeckFormat: (format) =>
    set((state) => {
      if (!state.deck) return state;
      return {
        deck: { ...state.deck, format, updatedAt: Date.now() },
      };
    }),

  reset: () => set({ ...initialState, id: createId() }),
}));
