"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Layers } from "lucide-react";
import { useProjectStore } from "@/store/project-store";

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
      {/* Extraction Summary */}
      {extraction && (
        <motion.div
          className="mb-12 bg-white/5 rounded-2xl p-8 border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm uppercase tracking-wider text-white/40">Strategic Extraction</h3>
            {extraction.deckType && (
              <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/20 text-violet-300">
                {extraction.deckType}
              </span>
            )}
          </div>
          <p className="text-xl text-white/90 font-medium mb-2">{extraction.objective}</p>
          {extraction.challenge && (
            <p className="text-white/50 text-sm mb-4">{extraction.challenge}</p>
          )}
          {extraction.insight && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 border-l-2 border-amber-400/40">
              <p className="text-xs uppercase tracking-wider text-amber-400/50 mb-1">Core Insight</p>
              <p className="text-white/80 text-sm italic">{extraction.insight}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-violet-400/60 mb-2">Audience</p>
              <p className="text-white/70 text-sm">
                {typeof extraction.audience === "string"
                  ? extraction.audience
                  : extraction.audience?.primary || "Not specified"}
              </p>
              {typeof extraction.audience === "object" && extraction.audience?.psychographics && (
                <p className="text-white/40 text-xs mt-1">{extraction.audience.psychographics}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-violet-400/60 mb-2">Tone</p>
              <p className="text-white/70 text-sm">
                {typeof extraction.tone === "string"
                  ? extraction.tone
                  : extraction.tone?.attributes?.join(", ") || "Not specified"}
              </p>
              {typeof extraction.tone === "object" && extraction.tone?.avoid && extraction.tone.avoid.length > 0 && (
                <p className="text-white/30 text-xs mt-1">Avoid: {extraction.tone.avoid.join(", ")}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400/60 mb-2">Key Insights</p>
              <ul className="space-y-1">
                {extraction.keyInsights.map((insight, i) => (
                  <li key={i} className="text-white/60 text-sm flex gap-2">
                    <span className="text-emerald-400/40 mt-0.5">-</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-rose-400/60 mb-2">Tensions</p>
              <ul className="space-y-1">
                {extraction.tensions.map((tension, i) => (
                  <li key={i} className="text-white/60 text-sm flex gap-2">
                    <span className="text-rose-400/40 mt-0.5">-</span>
                    {tension}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Story Shapes */}
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

                {/* Arc visualization */}
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

      {/* Continue */}
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
