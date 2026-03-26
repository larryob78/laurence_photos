"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Edit3,
  Eye,
  GripVertical,
  MessageSquare,
  Trash2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import type { DeckScene } from "@/lib/types";
import { getSceneInfo } from "@/lib/scene-taxonomy";
import { useProjectStore } from "@/store/project-store";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SceneCardProps {
  scene: DeckScene;
  index: number;
}

export function SceneCard({ scene, index }: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [showRefine, setShowRefine] = useState(false);

  const updateScene = useProjectStore((s) => s.updateScene);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const updateSceneFromAI = useProjectStore((s) => s.updateSceneFromAI);
  const info = getSceneInfo(scene.sceneType);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  const handleRegenerate = async (instruction?: string) => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene,
          instruction: instruction || "Rewrite this scene to be more compelling and specific. Improve the headline, subheadline, and body text.",
        }),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      const refined = await res.json();
      updateSceneFromAI(scene.id, refined);
      setShowRefine(false);
      setRefineInput("");
    } catch (err) {
      console.error("Regenerate failed:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        className={`relative rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br ${info.gradient}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        layout
      >
        {/* Scene header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors touch-none"
            >
              <GripVertical size={14} />
            </button>
            <span className="text-xs font-mono text-white/30">
              {String(scene.order).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/50">
              {info.label}
            </span>
            {scene.layout && (
              <span className="text-[10px] text-white/20">{scene.layout}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowRefine(!showRefine)}
              className={`p-2 rounded-lg transition-all ${
                showRefine
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-white/20 hover:text-white/40"
              }`}
              title="Refine with AI"
            >
              <Wand2 size={14} />
            </button>
            <button
              onClick={() => handleRegenerate()}
              disabled={isRegenerating}
              className="p-2 rounded-lg text-white/20 hover:text-white/40 transition-all disabled:opacity-30"
              title="Regenerate scene"
            >
              <RefreshCw
                size={14}
                className={isRegenerating ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-all ${
                showNotes
                  ? "bg-white/10 text-white/60"
                  : "text-white/20 hover:text-white/40"
              }`}
            >
              <MessageSquare size={14} />
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-all ${
                isEditing
                  ? "bg-white/10 text-white/60"
                  : "text-white/20 hover:text-white/40"
              }`}
            >
              {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
            </button>
            <button
              onClick={() => deleteScene(scene.id)}
              className="p-2 rounded-lg text-white/10 hover:text-rose-400/60 hover:bg-rose-500/10 transition-all"
              title="Delete scene"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* AI Refine input */}
        {showRefine && (
          <div className="px-6 pb-3">
            <div className="flex gap-2">
              <input
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                placeholder="Make it bolder... Add a question... Shorten..."
                className="flex-1 bg-white/5 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && refineInput.trim()) {
                    handleRegenerate(refineInput.trim());
                  }
                }}
              />
              <button
                onClick={() => refineInput.trim() && handleRegenerate(refineInput.trim())}
                disabled={!refineInput.trim() || isRegenerating}
                className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 disabled:opacity-30 transition-all"
              >
                {isRegenerating ? "..." : "Refine"}
              </button>
            </div>
          </div>
        )}

        {/* Scene content */}
        <div className="px-6 pb-6">
          <div
            className="w-12 h-1 rounded-full mb-4"
            style={{ backgroundColor: scene.colorAccent }}
          />

          {isEditing ? (
            <div className="space-y-3">
              <input
                value={scene.headline}
                onChange={(e) =>
                  updateScene(scene.id, { headline: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-xl font-bold focus:outline-none focus:border-white/20"
              />
              <input
                value={scene.subheadline}
                onChange={(e) =>
                  updateScene(scene.id, { subheadline: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/60 focus:outline-none focus:border-white/20"
              />
              <textarea
                value={scene.bodyText}
                onChange={(e) =>
                  updateScene(scene.id, { bodyText: e.target.value })
                }
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/50 text-sm resize-none focus:outline-none focus:border-white/20"
              />
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {scene.headline}
              </h3>
              <p className="text-white/50 mb-3">{scene.subheadline}</p>
              {scene.bodyText && (
                <p className="text-white/40 text-sm leading-relaxed">
                  {scene.bodyText}
                </p>
              )}
            </div>
          )}

          {/* Visual direction */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs uppercase tracking-wider text-white/20 mb-1">
              Visual Direction
            </p>
            <p className="text-white/30 text-xs">{scene.visualDirection}</p>
          </div>

          {/* Speaker notes */}
          {showNotes && (
            <motion.div
              className="mt-4 pt-4 border-t border-white/5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <p className="text-xs uppercase tracking-wider text-amber-400/40 mb-1">
                Speaker Notes
              </p>
              {isEditing ? (
                <textarea
                  value={scene.speakerNotes}
                  onChange={(e) =>
                    updateScene(scene.id, { speakerNotes: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-amber-400/40 text-sm resize-none focus:outline-none focus:border-white/20"
                />
              ) : (
                <p className="text-amber-400/30 text-sm">
                  {scene.speakerNotes}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
