"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Download,
  LayoutGrid,
  Rows3,
  Presentation,
  ArrowLeft,
  Plus,
  X,
  Wand2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useProjectStore } from "@/store/project-store";
import { SceneCard } from "./SceneCard";
import { DeckPresenter } from "./DeckPresenter";
import { SCENE_TAXONOMY } from "@/lib/scene-taxonomy";
import type { SceneType } from "@/lib/types";

export function DeckStage() {
  const { deck, setDeckFormat, setStage, reorderScenes, addScene, reset } =
    useProjectStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isPresenting, setIsPresenting] = useState(false);
  const [showAddScene, setShowAddScene] = useState(false);
  const [showRefineAll, setShowRefineAll] = useState(false);
  const [refineAllInput, setRefineAllInput] = useState("");
  const [isRefiningAll, setIsRefiningAll] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !deck || active.id === over.id) return;

      const oldIndex = deck.scenes.findIndex((s) => s.id === active.id);
      const newIndex = deck.scenes.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newScenes = [...deck.scenes];
      const [moved] = newScenes.splice(oldIndex, 1);
      newScenes.splice(newIndex, 0, moved);
      reorderScenes(newScenes.map((s) => s.id));
    },
    [deck, reorderScenes]
  );

  const handleExport = useCallback(() => {
    if (!deck) return;
    const data = JSON.stringify(deck, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deck]);

  const handleAddScene = useCallback(
    (sceneType: SceneType) => {
      addScene(null, sceneType);
      setShowAddScene(false);
    },
    [addScene]
  );

  const handleRefineAll = useCallback(async () => {
    if (!refineAllInput.trim() || !deck) return;
    setIsRefiningAll(true);
    // Refine each scene sequentially
    const updateSceneFromAI = useProjectStore.getState().updateSceneFromAI;
    for (const scene of deck.scenes) {
      try {
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene,
            instruction: refineAllInput.trim(),
            context: `Deck title: ${deck.title}. This is scene ${scene.order} of ${deck.scenes.length}.`,
          }),
        });
        if (res.ok) {
          const refined = await res.json();
          updateSceneFromAI(scene.id, refined);
        }
      } catch {
        // Continue with other scenes
      }
    }
    setIsRefiningAll(false);
    setShowRefineAll(false);
    setRefineAllInput("");
  }, [refineAllInput, deck]);

  if (!deck) return null;

  const sceneIds = deck.scenes.map((s) => s.id);

  return (
    <>
      <motion.div
        className="max-w-6xl mx-auto px-6 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Back button */}
        <button
          onClick={() => setStage("creative-routes")}
          className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-all text-sm mb-6"
        >
          <ArrowLeft size={14} /> Back to creative routes
        </button>

        {/* Deck Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.p
              className="text-sm uppercase tracking-wider text-white/30 mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Living Deck
            </motion.p>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {deck.title}
            </motion.h1>
            <motion.p
              className="text-lg text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {deck.subtitle}
            </motion.p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Format toggle */}
            <div className="flex gap-1 bg-white/5 rounded-full p-1">
              <button
                onClick={() => setDeckFormat("pitch")}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  deck.format === "pitch"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Pitch
              </button>
              <button
                onClick={() => setDeckFormat("workshop")}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  deck.format === "workshop"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Workshop
              </button>
            </div>

            {/* View mode */}
            <div className="flex gap-1 bg-white/5 rounded-full p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-full transition-all ${
                  viewMode === "list"
                    ? "bg-white/10 text-white"
                    : "text-white/40"
                }`}
              >
                <Rows3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full transition-all ${
                  viewMode === "grid"
                    ? "bg-white/10 text-white"
                    : "text-white/40"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowRefineAll(!showRefineAll)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all ${
                showRefineAll
                  ? "bg-violet-500/20 text-violet-300"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              }`}
            >
              <Wand2 size={14} /> Refine All
            </button>
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all"
            >
              <Play size={14} /> Present
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-all"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-white/40 text-sm hover:bg-white/10 hover:text-white/60 transition-all"
            >
              <RotateCcw size={14} /> New
            </button>
          </div>
        </div>

        {/* Refine All input */}
        <AnimatePresence>
          {showRefineAll && (
            <motion.div
              className="mb-8 bg-violet-500/5 rounded-2xl border border-violet-500/20 p-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm text-violet-300/60 mb-3">
                Refine all scenes at once with a single instruction
              </p>
              <div className="flex gap-3">
                <input
                  value={refineAllInput}
                  onChange={(e) => setRefineAllInput(e.target.value)}
                  placeholder="Make everything bolder... Shorten all body text... Add more questions for workshop format..."
                  className="flex-1 bg-white/5 border border-violet-500/20 rounded-xl px-4 py-3 text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && refineAllInput.trim()) {
                      handleRefineAll();
                    }
                  }}
                />
                <button
                  onClick={handleRefineAll}
                  disabled={!refineAllInput.trim() || isRefiningAll}
                  className="px-6 py-3 rounded-xl bg-violet-500/20 text-violet-300 font-medium hover:bg-violet-500/30 disabled:opacity-30 transition-all"
                >
                  {isRefiningAll
                    ? `Refining ${deck.scenes.length} scenes...`
                    : "Refine All"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene count + deck type */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Presentation size={16} className="text-white/20" />
          <span className="text-white/30 text-sm">
            {deck.scenes.length} scenes &middot; {deck.format} format
          </span>
          {deck.deckType && (
            <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400/50">
              {deck.deckType}
            </span>
          )}
          {deck.brandKitId && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30">
              Brand Kit Applied
            </span>
          )}
        </div>

        {/* Scenes with drag-and-drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sceneIds}
            strategy={
              viewMode === "grid"
                ? rectSortingStrategy
                : verticalListSortingStrategy
            }
          >
            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col gap-6"
              }
            >
              {deck.scenes.map((scene, index) => (
                <SceneCard key={scene.id} scene={scene} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Scene button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAddScene(!showAddScene)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${
              showAddScene
                ? "bg-white/10 border-white/20 text-white/60"
                : "bg-white/5 border-white/10 text-white/30 hover:text-white/50 hover:border-white/20"
            }`}
          >
            {showAddScene ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Add Scene
              </>
            )}
          </button>
        </div>

        {/* Scene type picker */}
        <AnimatePresence>
          {showAddScene && (
            <motion.div
              className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {SCENE_TAXONOMY.map((st) => (
                <button
                  key={st.type}
                  onClick={() => handleAddScene(st.type)}
                  className={`text-left p-3 rounded-xl bg-gradient-to-br ${st.gradient} border border-white/5 hover:border-white/15 transition-all`}
                >
                  <p className="text-white/70 text-sm font-medium">
                    {st.label}
                  </p>
                  <p className="text-white/30 text-[10px] mt-0.5 line-clamp-2">
                    {st.purpose}
                  </p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Presenter Mode */}
      {isPresenting && (
        <DeckPresenter
          scenes={deck.scenes}
          title={deck.title}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </>
  );
}
