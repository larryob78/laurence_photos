"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import type { BrandKit } from "@/lib/types";

interface BrandKitCreatorProps {
  onSave: (kit: BrandKit) => void;
  onClose: () => void;
}

export function BrandKitCreator({ onSave, onClose }: BrandKitCreatorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColors, setPrimaryColors] = useState([
    { name: "Primary", hex: "#6C5CE7", usage: "Headlines, accents" },
  ]);
  const [secondaryColors, setSecondaryColors] = useState([
    { name: "Secondary", hex: "#00CEC9", usage: "Supporting elements" },
  ]);
  const [headingFont, setHeadingFont] = useState("Inter, system-ui, sans-serif");
  const [bodyFont, setBodyFont] = useState("Inter, system-ui, sans-serif");
  const [headlineStyle, setHeadlineStyle] = useState("Bold, sentence case");
  const [personality, setPersonality] = useState("Confident, Modern");
  const [weAre, setWeAre] = useState("Clear, Direct");
  const [weAreNot, setWeAreNot] = useState("Corporate, Jargon-heavy");
  const [visualStyle, setVisualStyle] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    const kit: BrandKit = {
      id: `kit-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `Custom brand kit: ${name.trim()}`,
      colors: {
        primary: primaryColors,
        secondary: secondaryColors,
        neutral: [
          { name: "White", hex: "#FFFFFF", usage: "Backgrounds" },
          { name: "Dark", hex: "#1A1A1A", usage: "Text" },
        ],
      },
      typography: {
        headingFamily: headingFont,
        bodyFamily: bodyFont,
        headlineStyle,
      },
      toneOfVoice: {
        personality: personality.split(",").map((s) => s.trim()).filter(Boolean),
        weAre: weAre.split(",").map((s) => s.trim()).filter(Boolean),
        weAreNot: weAreNot.split(",").map((s) => s.trim()).filter(Boolean),
      },
      visualStyle: visualStyle || `Clean visual system using ${name} brand colours. ${headlineStyle}.`,
    };
    onSave(kit);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#111] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Create Brand Kit</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Brand Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Brand"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the brand style"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 text-sm focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Colours */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 mb-3 block">Primary Colours</label>
            {primaryColors.map((c, i) => (
              <div key={i} className="flex gap-3 mb-2 items-center">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => {
                    const updated = [...primaryColors];
                    updated[i] = { ...c, hex: e.target.value };
                    setPrimaryColors(updated);
                  }}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  value={c.name}
                  onChange={(e) => {
                    const updated = [...primaryColors];
                    updated[i] = { ...c, name: e.target.value };
                    setPrimaryColors(updated);
                  }}
                  placeholder="Colour name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
                />
                <span className="text-white/30 text-xs font-mono w-20">{c.hex}</span>
                {primaryColors.length > 1 && (
                  <button onClick={() => setPrimaryColors(primaryColors.filter((_, j) => j !== i))} className="text-white/20 hover:text-rose-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setPrimaryColors([...primaryColors, { name: "", hex: "#888888", usage: "" }])}
              className="flex items-center gap-1 text-white/30 hover:text-white/50 text-xs mt-1 transition-colors"
            >
              <Plus size={12} /> Add colour
            </button>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 mb-3 block">Secondary Colours</label>
            {secondaryColors.map((c, i) => (
              <div key={i} className="flex gap-3 mb-2 items-center">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => {
                    const updated = [...secondaryColors];
                    updated[i] = { ...c, hex: e.target.value };
                    setSecondaryColors(updated);
                  }}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  value={c.name}
                  onChange={(e) => {
                    const updated = [...secondaryColors];
                    updated[i] = { ...c, name: e.target.value };
                    setSecondaryColors(updated);
                  }}
                  placeholder="Colour name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
                />
                <span className="text-white/30 text-xs font-mono w-20">{c.hex}</span>
                {secondaryColors.length > 1 && (
                  <button onClick={() => setSecondaryColors(secondaryColors.filter((_, j) => j !== i))} className="text-white/20 hover:text-rose-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setSecondaryColors([...secondaryColors, { name: "", hex: "#888888", usage: "" }])}
              className="flex items-center gap-1 text-white/30 hover:text-white/50 text-xs mt-1 transition-colors"
            >
              <Plus size={12} /> Add colour
            </button>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Heading Font</label>
              <input
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Body Font</label>
              <input
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Headline Style</label>
            <input
              value={headlineStyle}
              onChange={(e) => setHeadlineStyle(e.target.value)}
              placeholder="e.g., Bold, tight tracking, sentence case"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Tone */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Personality</label>
              <input
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Bold, Warm, Direct"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">We Are</label>
              <input
                value={weAre}
                onChange={(e) => setWeAre(e.target.value)}
                placeholder="Clear, Honest"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">We Are Not</label>
              <input
                value={weAreNot}
                onChange={(e) => setWeAreNot(e.target.value)}
                placeholder="Corporate, Preachy"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          {/* Visual Style */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">Visual Style (optional)</label>
            <textarea
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              rows={3}
              placeholder="Describe the overall visual world — colours, textures, photography style, layout preferences..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 text-sm resize-none focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-white/40 hover:text-white/60 text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-30 transition-all"
          >
            Create Brand Kit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
