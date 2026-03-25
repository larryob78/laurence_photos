"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Palette, Zap } from "lucide-react";
import { useProjectStore } from "@/store/project-store";
import type { LivingDeck } from "@/lib/types";

export function CreativeRoutesStage() {
  const {
    extraction,
    creativeRoutes,
    selectedCreativeRouteId,
    selectCreativeRoute,
    setDeck,
    setStage,
  } = useProjectStore();

  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<"pitch" | "workshop">("pitch");

  const handleGenerate = useCallback(async () => {
    if (!selectedCreativeRouteId || !extraction) return;
    const route = creativeRoutes.find((r) => r.id === selectedCreativeRouteId);
    if (!route) return;

    setIsLoading(true);
    setStage("generating-deck");

    try {
      const res = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction, route, format }),
      });
      if (!res.ok) throw new Error("Failed to generate deck");
      const deck: LivingDeck = await res.json();
      setDeck(deck);
      setStage("deck");
    } catch (err) {
      console.error("Failed to generate deck:", err);
      setStage("creative-routes");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCreativeRouteId, extraction, creativeRoutes, format, setDeck, setStage]);

  if (creativeRoutes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Zap size={48} className="text-amber-400" />
        </motion.div>
        <p className="text-white/40 mt-6">Generating creative routes...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-5xl mx-auto px-6 py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose your creative route</h2>
        <p className="text-white/40">
          Three distinct creative directions. Each one a different world.
        </p>
      </div>

      <div className="grid gap-6">
        {creativeRoutes.map((route, index) => (
          <motion.button
            key={route.id}
            onClick={() => selectCreativeRoute(route.id)}
            className={`relative text-left p-8 rounded-2xl border transition-all ${
              selectedCreativeRouteId === route.id
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            {selectedCreativeRouteId === route.id && (
              <motion.div
                className="absolute top-6 right-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              </motion.div>
            )}

            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Palette size={20} className="text-amber-400/60" />
              </div>
              <div className="flex-1 pr-12">
                <h3 className="text-xl font-semibold text-white mb-2">{route.name}</h3>
                <p className="text-white/60 mb-6">{route.concept}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-amber-400/60 mb-2">Visual World</p>
                    <p className="text-white/50 text-sm">{route.visualWorld}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-amber-400/60 mb-2">Tonal Register</p>
                    <p className="text-white/50 text-sm">{route.tonalRegister}</p>
                  </div>
                </div>

                {/* Scene outline */}
                <div className="flex gap-2 flex-wrap">
                  {route.scenes.map((scene, i) => (
                    <span
                      key={i}
                      className="text-xs text-white/30 bg-white/5 px-3 py-1 rounded-full"
                    >
                      {i + 1}. {scene.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Format Selection */}
      {selectedCreativeRouteId && (
        <motion.div
          className="mt-12 flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-white/40 text-sm uppercase tracking-wider">Deck Format</p>
          <div className="flex gap-3 bg-white/5 rounded-full p-1">
            <button
              onClick={() => setFormat("pitch")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                format === "pitch"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Pitch Deck
            </button>
            <button
              onClick={() => setFormat("workshop")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                format === "workshop"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Workshop Deck
            </button>
          </div>
        </motion.div>
      )}

      {/* Generate */}
      <motion.div
        className="flex justify-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedCreativeRouteId ? 1 : 0.3 }}
      >
        <button
          onClick={handleGenerate}
          disabled={!selectedCreativeRouteId || isLoading}
          className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? "Building your deck..." : "Build Living Deck"}
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </motion.div>
  );
}
