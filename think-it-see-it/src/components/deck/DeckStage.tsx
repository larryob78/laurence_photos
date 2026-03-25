"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  Download,
  LayoutGrid,
  Rows3,
  Presentation,
} from "lucide-react";
import { useProjectStore } from "@/store/project-store";
import { SceneCard } from "./SceneCard";
import { DeckPresenter } from "./DeckPresenter";

export function DeckStage() {
  const { deck, setDeckFormat, reset } = useProjectStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isPresenting, setIsPresenting] = useState(false);

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

  if (!deck) return null;

  return (
    <>
      <motion.div
        className="max-w-6xl mx-auto px-6 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
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
                  viewMode === "list" ? "bg-white/10 text-white" : "text-white/40"
                }`}
              >
                <Rows3 size={14} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full transition-all ${
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {/* Actions */}
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

        {/* Scene count */}
        <div className="flex items-center gap-3 mb-8">
          <Presentation size={16} className="text-white/20" />
          <span className="text-white/30 text-sm">
            {deck.scenes.length} scenes &middot; {deck.format} format
          </span>
        </div>

        {/* Scenes */}
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
