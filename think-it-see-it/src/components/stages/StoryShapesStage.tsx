"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Layers } from "lucide-react";
import { useProjectStore } from "@/store/project-store";
import { ExtractionDisplay } from "@/components/ExtractionDisplay";

export function StoryShapesStage() {
  const {
    extraction,
    storyShapes,
    selectedStoryShapeId,
    selectStoryShape,
    setCreativeRoutes,
    setStage,
  } = useProjectStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = useCallback(async () => {
    if (!selectedStoryShapeId || !extraction) return;

    const shape = storyShapes.find((s) => s.id === selectedStoryShapeId);
    if (!shape) return;

    setIsLoading(true);
    setStage("creative-routes");

    try {
      const res = await fetch("/api/creative-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction, storyShape: shape }),
      });
      if (!res.ok) throw new Error("Failed to generate creative routes");
      const routes = await res.json();
      setCreativeRoutes(routes);
    } catch (err) {
      console.error("Failed to generate creative routes:", err);
      setStage("story-shapes");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStoryShapeId, extraction, storyShapes, setCreativeRoutes, setStage]);

  return (
    <motion.div
      className="max-w-5xl mx-auto px-6 py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {extraction && <ExtractionDisplay extraction={extraction} />}

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose your story shape</h2>
        <p className="text-white/40">
          Each shape gives your presentation a different narrative structure and emotional arc.
        </p>
      </div>

      <div className="grid gap-6">
        {storyShapes.map((shape, index) => (
          <motion.button
            key={shape.id}
            onClick={() => selectStoryShape(shape.id)}
            className={`relative text-left p-8 rounded-2xl border transition-all ${
              selectedStoryShapeId === shape.id
                ? "bg-violet-500/10 border-violet-500/40"
                : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {selectedStoryShapeId === shape.id && (
              <motion.div
                className="absolute top-6 right-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              </motion.div>
            )}

            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Layers size={20} className="text-violet-400/60" />
              </div>
              <div className="flex-1 pr-12">
                <h3 className="text-xl font-semibold text-white mb-2">{shape.name}</h3>
                <p className="text-white/60 mb-4">{shape.description}</p>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {shape.arc.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">
                        {step}
                      </span>
                      {i < shape.arc.length - 1 && (
                        <ArrowRight size={12} className="text-white/20" />
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-white/40 italic">{shape.reasoning}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        className="flex justify-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedStoryShapeId ? 1 : 0.3 }}
      >
        <button
          onClick={handleContinue}
          disabled={!selectedStoryShapeId || isLoading}
          className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? "Generating routes..." : "Generate Creative Routes"}
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </motion.div>
  );
}
