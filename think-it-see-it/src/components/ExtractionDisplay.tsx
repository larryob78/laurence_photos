"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Target,
  Users,
  Lightbulb,
  TrendingUp,
  Zap,
  Shield,
  HelpCircle,
} from "lucide-react";
import type { StrategicExtraction } from "@/lib/types";

interface ExtractionDisplayProps {
  extraction: StrategicExtraction;
}

function ConfidenceDot({ score }: { score: number }) {
  const color =
    score >= 0.8
      ? "bg-emerald-400"
      : score >= 0.5
        ? "bg-amber-400"
        : "bg-rose-400";
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${color}`}
      title={`Confidence: ${Math.round(score * 100)}%`}
    />
  );
}

export function ExtractionDisplay({ extraction: e }: ExtractionDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="mb-12 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="p-8 pb-0">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wider text-white/40">
            Strategic Extraction
          </h3>
          <div className="flex items-center gap-2">
            {e.deckType && (
              <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/20 text-violet-300">
                {e.deckType}
              </span>
            )}
            {e.clientName && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/40">
                {e.clientName}
              </span>
            )}
          </div>
        </div>

        {/* Objective + Challenge */}
        <p className="text-xl text-white/90 font-medium mb-2 flex items-center gap-2">
          {e.confidence?.brief && <ConfidenceDot score={e.confidence.brief} />}
          {e.objective}
        </p>
        {e.challenge && (
          <p className="text-white/50 text-sm mb-4">{e.challenge}</p>
        )}
      </div>

      {/* Core insight — always visible if present */}
      {e.insight && (
        <div className="mx-8 mb-6 bg-white/5 rounded-xl p-4 border-l-2 border-amber-400/40">
          <p className="text-xs uppercase tracking-wider text-amber-400/50 mb-1 flex items-center gap-2">
            <Lightbulb size={12} />
            Core Insight
            {e.confidence?.insight && <ConfidenceDot score={e.confidence.insight} />}
          </p>
          <p className="text-white/80 text-sm italic">&ldquo;{e.insight}&rdquo;</p>
        </div>
      )}

      {/* Key fields grid */}
      <div className="px-8 pb-6 grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-violet-400/60 mb-2 flex items-center gap-1.5">
            <Users size={11} /> Audience
            {e.confidence?.audience && <ConfidenceDot score={e.confidence.audience} />}
          </p>
          <p className="text-white/70 text-sm">
            {typeof e.audience === "string"
              ? e.audience
              : e.audience?.primary || "Not specified"}
          </p>
          {typeof e.audience === "object" && e.audience?.psychographics && (
            <p className="text-white/40 text-xs mt-1">{e.audience.psychographics}</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-violet-400/60 mb-2 flex items-center gap-1.5">
            <Zap size={11} /> Tone
            {e.confidence?.tone && <ConfidenceDot score={e.confidence.tone} />}
          </p>
          <p className="text-white/70 text-sm">
            {typeof e.tone === "string"
              ? e.tone
              : e.tone?.attributes?.join(", ") || "Not specified"}
          </p>
          {typeof e.tone === "object" && e.tone?.avoid && e.tone.avoid.length > 0 && (
            <p className="text-white/30 text-xs mt-1">Avoid: {e.tone.avoid.join(", ")}</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-400/60 mb-2 flex items-center gap-1.5">
            <Lightbulb size={11} /> Key Insights
          </p>
          <ul className="space-y-1">
            {e.keyInsights.map((insight, i) => (
              <li key={i} className="text-white/60 text-sm flex gap-2">
                <span className="text-emerald-400/40 mt-0.5 shrink-0">-</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-rose-400/60 mb-2 flex items-center gap-1.5">
            <AlertCircle size={11} /> Tensions
          </p>
          <ul className="space-y-1">
            {e.tensions.map((tension, i) => (
              <li key={i} className="text-white/60 text-sm flex gap-2">
                <span className="text-rose-400/40 mt-0.5 shrink-0">-</span>
                {tension}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expandable deep fields */}
      <div className="border-t border-white/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-8 py-3 flex items-center justify-between text-white/30 hover:text-white/50 transition-all text-xs uppercase tracking-wider"
        >
          <span>{expanded ? "Hide details" : "Show full extraction"}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="px-8 pb-8"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Proposition */}
                {e.proposition && (
                  <div className="md:col-span-2 bg-violet-500/5 rounded-xl p-4 border border-violet-500/10">
                    <p className="text-xs uppercase tracking-wider text-violet-400/50 mb-1 flex items-center gap-1.5">
                      <Target size={11} /> Proposition
                      {e.confidence?.proposition && <ConfidenceDot score={e.confidence.proposition} />}
                    </p>
                    <p className="text-white/80 text-sm font-medium">{e.proposition}</p>
                  </div>
                )}

                {/* Opportunities */}
                {e.opportunities.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-emerald-400/60 mb-2 flex items-center gap-1.5">
                      <TrendingUp size={11} /> Opportunities
                    </p>
                    <ul className="space-y-1">
                      {e.opportunities.map((opp, i) => (
                        <li key={i} className="text-white/50 text-sm flex gap-2">
                          <span className="text-emerald-400/30 mt-0.5 shrink-0">+</span>
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Market Context */}
                {e.marketContext && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-400/60 mb-2">Market Context</p>
                    {e.marketContext.category && (
                      <p className="text-white/50 text-sm mb-1">
                        <span className="text-white/30">Category:</span> {e.marketContext.category}
                      </p>
                    )}
                    {e.marketContext.competitors && e.marketContext.competitors.length > 0 && (
                      <p className="text-white/50 text-sm mb-1">
                        <span className="text-white/30">Competitors:</span> {e.marketContext.competitors.join(", ")}
                      </p>
                    )}
                    {e.marketContext.categoryState && (
                      <p className="text-white/40 text-xs mt-1 italic">{e.marketContext.categoryState}</p>
                    )}
                  </div>
                )}

                {/* Idea Territories */}
                {e.ideaTerritories && e.ideaTerritories.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-orange-400/60 mb-3">Idea Territories</p>
                    <div className="grid md:grid-cols-3 gap-3">
                      {e.ideaTerritories.map((territory, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white/70 text-sm font-medium">{territory.name}</p>
                            {territory.risk && (
                              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                                territory.risk === "bold"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : territory.risk === "moderate"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-emerald-500/20 text-emerald-300"
                              }`}>
                                {territory.risk}
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs">{territory.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proof */}
                {e.proof && e.proof.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-cyan-400/60 mb-2 flex items-center gap-1.5">
                      <Shield size={11} /> Proof Points
                    </p>
                    <ul className="space-y-1">
                      {e.proof.map((p, i) => (
                        <li key={i} className="text-white/50 text-xs flex gap-2">
                          <span className="text-cyan-400/30 mt-0.5 shrink-0">#</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Constraints */}
                {e.constraints && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-red-400/60 mb-2">Constraints</p>
                    <div className="space-y-1">
                      {e.constraints.budget && <p className="text-white/40 text-xs"><span className="text-white/25">Budget:</span> {e.constraints.budget}</p>}
                      {e.constraints.timeline && <p className="text-white/40 text-xs"><span className="text-white/25">Timeline:</span> {e.constraints.timeline}</p>}
                      {e.constraints.channels && e.constraints.channels.length > 0 && <p className="text-white/40 text-xs"><span className="text-white/25">Channels:</span> {e.constraints.channels.join(", ")}</p>}
                      {e.constraints.stakeholder && <p className="text-white/40 text-xs"><span className="text-white/25">Stakeholders:</span> {e.constraints.stakeholder}</p>}
                    </div>
                  </div>
                )}

                {/* Unknowns */}
                {e.unknowns && e.unknowns.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-amber-400/60 mb-2 flex items-center gap-1.5">
                      <HelpCircle size={11} /> Unknowns
                    </p>
                    <ul className="space-y-1">
                      {e.unknowns.map((u, i) => (
                        <li key={i} className="text-white/40 text-xs flex gap-2">
                          <span className="text-amber-400/30 mt-0.5 shrink-0">?</span>
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Desired Outcome */}
                {e.desiredOutcome && (
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-white/30 mb-1">Desired Outcome</p>
                    <p className="text-white/50 text-sm">{e.desiredOutcome}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
