"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { DeckScene } from "@/lib/types";

const SCENE_TYPE_STYLES: Record<DeckScene["sceneType"], string> = {
  title: "from-violet-950 via-purple-950 to-indigo-950",
  insight: "from-emerald-950 via-teal-950 to-green-950",
  tension: "from-rose-950 via-red-950 to-orange-950",
  idea: "from-amber-950 via-yellow-950 to-orange-950",
  evidence: "from-blue-950 via-cyan-950 to-sky-950",
  action: "from-green-950 via-emerald-950 to-teal-950",
  closing: "from-purple-950 via-pink-950 to-rose-950",
};

interface DeckPresenterProps {
  scenes: DeckScene[];
  title: string;
  onClose: () => void;
}

export function DeckPresenter({ scenes, title, onClose }: DeckPresenterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const scene = scenes[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < scenes.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, scenes.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  if (!scene) return null;

  const bgStyle = SCENE_TYPE_STYLES[scene.sceneType] || SCENE_TYPE_STYLES.idea;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Controls */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white/30 text-sm font-mono">
            {currentIndex + 1} / {scenes.length}
          </span>
          <span className="text-white/20 text-sm">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scene */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={scene.id}
          custom={direction}
          className={`absolute inset-0 flex flex-col items-center justify-center px-12 md:px-24 bg-gradient-to-br ${bgStyle}`}
          initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="max-w-4xl w-full text-center">
            <div
              className="w-16 h-1 rounded-full mx-auto mb-8"
              style={{ backgroundColor: scene.colorAccent }}
            />
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {scene.headline}
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-white/60 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {scene.subheadline}
            </motion.p>
            <motion.p
              className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {scene.bodyText}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 z-10">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? "w-8 bg-white/60"
                  : "w-1.5 bg-white/20 hover:bg-white/30"
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === scenes.length - 1}
          className="p-3 rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </motion.div>
  );
}
