// ============================================================
// THINK IT. SEE IT. — Scene Taxonomy
// 24 scene types from research, with metadata for UI and generation
// ============================================================

import type { SceneType, DeckType, LayoutType } from "./types";

export interface SceneTypeInfo {
  type: SceneType;
  label: string;
  purpose: string;
  copyDensity: "minimal" | "low" | "medium" | "high";
  defaultLayout: LayoutType;
  gradient: string;
  icon: string;
  typicalPosition: string;
}

export const SCENE_TAXONOMY: SceneTypeInfo[] = [
  { type: "cover", label: "Cover", purpose: "Set tone, identity, and first impression", copyDensity: "minimal", defaultLayout: "centred", gradient: "from-violet-600/20 to-purple-600/20", icon: "Sparkles", typicalPosition: "1" },
  { type: "intro", label: "Intro", purpose: "Establish who is presenting and why", copyDensity: "low", defaultLayout: "split-left", gradient: "from-blue-600/20 to-indigo-600/20", icon: "Users", typicalPosition: "2-3" },
  { type: "overview", label: "Overview", purpose: "Orient the audience to what follows", copyDensity: "low", defaultLayout: "centred", gradient: "from-slate-600/20 to-zinc-600/20", icon: "List", typicalPosition: "2-4" },
  { type: "brief", label: "Brief", purpose: "Recap the client's original brief", copyDensity: "medium", defaultLayout: "centred", gradient: "from-sky-600/20 to-blue-600/20", icon: "FileText", typicalPosition: "3-5" },
  { type: "challenge", label: "Challenge", purpose: "Define the core problem", copyDensity: "medium", defaultLayout: "centred", gradient: "from-rose-600/20 to-red-600/20", icon: "AlertTriangle", typicalPosition: "4-7" },
  { type: "audience", label: "Audience", purpose: "Bring the target audience to life", copyDensity: "medium", defaultLayout: "grid", gradient: "from-teal-600/20 to-cyan-600/20", icon: "Users", typicalPosition: "5-8" },
  { type: "market_context", label: "Market Context", purpose: "Show the competitive and cultural landscape", copyDensity: "high", defaultLayout: "dashboard", gradient: "from-gray-600/20 to-slate-600/20", icon: "BarChart3", typicalPosition: "4-7" },
  { type: "insight", label: "Insight", purpose: "Reveal the core human or cultural truth", copyDensity: "low", defaultLayout: "centred", gradient: "from-amber-600/20 to-yellow-600/20", icon: "Lightbulb", typicalPosition: "6-9" },
  { type: "strategy", label: "Strategy", purpose: "Present the strategic framework", copyDensity: "medium", defaultLayout: "centred", gradient: "from-indigo-600/20 to-violet-600/20", icon: "Target", typicalPosition: "7-10" },
  { type: "opportunity", label: "Opportunity", purpose: "Frame the strategic opening", copyDensity: "low", defaultLayout: "centred", gradient: "from-emerald-600/20 to-green-600/20", icon: "TrendingUp", typicalPosition: "7-10" },
  { type: "proposition", label: "Proposition", purpose: "State the core proposition", copyDensity: "low", defaultLayout: "centred", gradient: "from-purple-600/20 to-fuchsia-600/20", icon: "Zap", typicalPosition: "8-11" },
  { type: "route_reveal", label: "Route Reveal", purpose: "Introduce a creative direction", copyDensity: "medium", defaultLayout: "full-bleed", gradient: "from-orange-600/20 to-amber-600/20", icon: "Compass", typicalPosition: "9-13" },
  { type: "idea_board", label: "Idea Board", purpose: "Show the creative idea in full expression", copyDensity: "low", defaultLayout: "full-bleed", gradient: "from-pink-600/20 to-rose-600/20", icon: "Palette", typicalPosition: "10-14" },
  { type: "execution", label: "Execution", purpose: "Show how the idea lives across channels", copyDensity: "low", defaultLayout: "grid", gradient: "from-cyan-600/20 to-blue-600/20", icon: "Layout", typicalPosition: "11-16" },
  { type: "media_plan", label: "Media Plan", purpose: "Show where and when the work appears", copyDensity: "high", defaultLayout: "dashboard", gradient: "from-blue-600/20 to-sky-600/20", icon: "Calendar", typicalPosition: "14-17" },
  { type: "timeline", label: "Timeline", purpose: "Show project phases and milestones", copyDensity: "medium", defaultLayout: "editorial", gradient: "from-slate-600/20 to-gray-600/20", icon: "Clock", typicalPosition: "15-18" },
  { type: "production", label: "Production", purpose: "Explain how the work will be made", copyDensity: "medium", defaultLayout: "split-left", gradient: "from-stone-600/20 to-zinc-600/20", icon: "Wrench", typicalPosition: "16-19" },
  { type: "budget", label: "Budget", purpose: "Present cost and investment structure", copyDensity: "high", defaultLayout: "dashboard", gradient: "from-green-600/20 to-emerald-600/20", icon: "DollarSign", typicalPosition: "17-19" },
  { type: "case_study", label: "Case Study", purpose: "Prove capability through past work", copyDensity: "medium", defaultLayout: "editorial", gradient: "from-amber-600/20 to-orange-600/20", icon: "Award", typicalPosition: "varies" },
  { type: "quote", label: "Quote", purpose: "Add human voice or external authority", copyDensity: "low", defaultLayout: "centred", gradient: "from-violet-600/20 to-indigo-600/20", icon: "Quote", typicalPosition: "variable" },
  { type: "results", label: "Results", purpose: "Show measurable outcomes and impact", copyDensity: "medium", defaultLayout: "dashboard", gradient: "from-emerald-600/20 to-teal-600/20", icon: "TrendingUp", typicalPosition: "15-18" },
  { type: "provocation", label: "Provocation", purpose: "Challenge assumptions and stimulate thinking", copyDensity: "minimal", defaultLayout: "centred", gradient: "from-red-600/20 to-orange-600/20", icon: "Flame", typicalPosition: "variable" },
  { type: "exercise", label: "Exercise", purpose: "Facilitate group activity during workshop", copyDensity: "medium", defaultLayout: "editorial", gradient: "from-yellow-600/20 to-amber-600/20", icon: "PenTool", typicalPosition: "mid-deck" },
  { type: "divider", label: "Divider", purpose: "Create a visual pause between sections", copyDensity: "minimal", defaultLayout: "full-bleed", gradient: "from-neutral-600/20 to-stone-600/20", icon: "Minus", typicalPosition: "between sections" },
  { type: "closing", label: "Closing", purpose: "End with impact and clear next steps", copyDensity: "low", defaultLayout: "centred", gradient: "from-purple-600/20 to-pink-600/20", icon: "ArrowRight", typicalPosition: "final" },
];

/** Recommended scene sequences per deck type — from agency_deck_structures.md */
export const DECK_TYPE_SCENES: Record<DeckType, SceneType[]> = {
  pitch: ["cover", "brief", "challenge", "audience", "market_context", "insight", "strategy", "proposition", "route_reveal", "idea_board", "execution", "execution", "media_plan", "timeline", "budget", "closing"],
  strategy: ["cover", "overview", "market_context", "audience", "market_context", "challenge", "insight", "strategy", "opportunity", "proposition", "timeline", "closing"],
  campaign: ["cover", "brief", "audience", "insight", "proposition", "route_reveal", "idea_board", "execution", "execution", "execution", "media_plan", "timeline", "production", "budget", "closing"],
  credentials: ["cover", "intro", "quote", "case_study", "case_study", "case_study", "results", "closing"],
  innovation: ["cover", "provocation", "market_context", "audience", "insight", "opportunity", "idea_board", "execution", "results", "timeline", "budget", "closing"],
  workshop: ["cover", "overview", "provocation", "challenge", "exercise", "insight", "exercise", "strategy", "exercise", "closing"],
  "case-study": ["cover", "challenge", "insight", "strategy", "idea_board", "execution", "results", "quote", "closing"],
  keynote: ["cover", "provocation", "insight", "case_study", "insight", "provocation", "closing"],
};

export function getSceneInfo(type: SceneType): SceneTypeInfo {
  return SCENE_TAXONOMY.find((s) => s.type === type) || SCENE_TAXONOMY[0];
}

/** Deck type display info */
export const DECK_TYPE_INFO: Record<DeckType, { label: string; description: string; icon: string }> = {
  pitch: { label: "Pitch Deck", description: "Win new business. Persuade and close.", icon: "Target" },
  strategy: { label: "Strategy Deck", description: "Align stakeholders on direction.", icon: "Compass" },
  campaign: { label: "Campaign Deck", description: "Present a specific campaign idea.", icon: "Megaphone" },
  credentials: { label: "Credentials Deck", description: "Prove capability through past work.", icon: "Award" },
  innovation: { label: "Innovation Deck", description: "Propose new products or ventures.", icon: "Rocket" },
  workshop: { label: "Workshop Deck", description: "Facilitate collaborative thinking.", icon: "Users" },
  "case-study": { label: "Case Study Deck", description: "Tell the story of a success.", icon: "BookOpen" },
  keynote: { label: "Keynote", description: "Inspire an audience. Thought leadership.", icon: "Mic" },
};
