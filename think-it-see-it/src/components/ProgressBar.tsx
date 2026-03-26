"use client";

import { motion } from "framer-motion";
import { Home } from "lucide-react";
import type { Stage } from "@/lib/types";

const STAGES: { key: Stage; label: string }[] = [
  { key: "input", label: "Input" },
  { key: "story-shapes", label: "Story Shape" },
  { key: "creative-routes", label: "Creative Route" },
  { key: "deck", label: "Living Deck" },
];

interface ProgressBarProps {
  currentStage: Stage;
  onHome?: () => void;
}

export function ProgressBar({ currentStage, onHome }: ProgressBarProps) {
  const activeIndex = STAGES.findIndex(
    (s) =>
      s.key === currentStage ||
      (currentStage === "analyzing" && s.key === "input") ||
      (currentStage === "generating-deck" && s.key === "deck")
  );

  if (currentStage === "input") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          {onHome && (
            <button
              onClick={onHome}
              className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-all mr-1"
              title="All projects"
            >
              <Home size={14} />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            {STAGES.map((stage, i) => {
              const isActive = i <= activeIndex;
              const isCurrent =
                stage.key === currentStage ||
                (currentStage === "analyzing" && stage.key === "input") ||
                (currentStage === "generating-deck" && stage.key === "deck");

              return (
                <div key={stage.key} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <motion.div
                      className={`h-1 flex-1 rounded-full ${
                        isActive ? "bg-white/40" : "bg-white/10"
                      }`}
                      initial={false}
                      animate={{
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(255,255,255,0.1)",
                      }}
                    />
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isCurrent
                          ? "text-white/80 font-medium"
                          : isActive
                            ? "text-white/40"
                            : "text-white/20"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
