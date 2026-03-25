"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Palette, Zap, Sparkles, Plus } from "lucide-react";
import { useProjectStore } from "@/store/project-store";
import { BRAND_KITS } from "@/lib/brand-kits";
import { BrandKitCreator } from "@/components/BrandKitCreator";
import type { LivingDeck, BrandKit } from "@/lib/types";

export function CreativeRoutesStage() {
  const {
    extraction,
    creativeRoutes,
    selectedCreativeRouteId,
    selectCreativeRoute,
    selectedBrandKitId,
    selectBrandKit,
    setDeck,
    setStage,
  } = useProjectStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<"pitch" | "workshop">("pitch");
  const [showBrandKitCreator, setShowBrandKitCreator] = useState(false);
  const [customKits, setCustomKits] = useState<BrandKit[]>([]);
  const allKits = [...BRAND_KITS, ...customKits];

  const handleGenerate = useCallback(async () => {
    if (!selectedCreativeRouteId || !extraction) return;
    const route = creativeRoutes.find((r) => r.id === selectedCreativeRouteId);
    if (!route) return;

    const brandKit = allKits.find((k) => k.id === selectedBrandKitId);

    setError(null);
    setIsLoading(true);
    setStage("generating-deck");

    try {
      const res = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction,
          route,
          format,
          deckType: extraction.deckType || "pitch",
          brandKit: brandKit || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate deck. Please try again.");
      const deck: LivingDeck = await res.json();
      setDeck(deck);
      setStage("deck");
    } catch (err) {
      console.error("Failed to generate deck:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("creative-routes");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCreativeRouteId, extraction, creativeRoutes, format, selectedBrandKitId, allKits, setDeck, setStage]);

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
      {/* Back button */}
      <button
        onClick={() => setStage("story-shapes")}
        className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-all text-sm mb-8"
      >
        <ArrowLeft size={14} /> Back to story shapes
      </button>

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
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-white">{route.name}</h3>
                  {route.risk && (
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                      route.risk === "bold"
                        ? "bg-rose-500/20 text-rose-300"
                        : route.risk === "moderate"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {route.risk}
                    </span>
                  )}
                </div>
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

      {/* Brand Kit + Format Selection */}
      {selectedCreativeRouteId && (
        <motion.div
          className="mt-12 space-y-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Brand Kit Selector */}
          <div>
            <p className="text-white/40 text-sm uppercase tracking-wider text-center mb-4 flex items-center justify-center gap-2">
              <Sparkles size={14} /> Brand Kit
            </p>
            <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {allKits.map((kit) => (
                <button
                  key={kit.id}
                  onClick={() => selectBrandKit(selectedBrandKitId === kit.id ? null : kit.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedBrandKitId === kit.id
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {kit.colors.primary.map((c) => (
                        <div
                          key={c.hex}
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {kit.colors.secondary.slice(0, 1).map((c) => (
                        <div
                          key={c.hex}
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    {selectedBrandKitId === kit.id && <Check size={14} className="text-white/60 ml-auto" />}
                  </div>
                  <p className="text-white/80 text-sm font-medium">{kit.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">{kit.description}</p>
                </button>
              ))}
              {/* Create custom kit */}
              <button
                onClick={() => setShowBrandKitCreator(true)}
                className="p-4 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-white/30 hover:text-white/50 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Plus size={20} />
                <p className="text-xs">Custom Kit</p>
              </button>
            </div>
            <p className="text-center text-white/20 text-xs mt-2">Optional — affects visual direction and tone</p>

            {/* Brand Kit Creator Modal */}
            <AnimatePresence>
              {showBrandKitCreator && (
                <BrandKitCreator
                  onSave={(kit) => {
                    setCustomKits((prev) => [...prev, kit]);
                    selectBrandKit(kit.id);
                    setShowBrandKitCreator(false);
                  }}
                  onClose={() => setShowBrandKitCreator(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Format */}
          <div className="flex flex-col items-center gap-4">
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
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.p
          className="text-rose-400 text-sm mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

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
