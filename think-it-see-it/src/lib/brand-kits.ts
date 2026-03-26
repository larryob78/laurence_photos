// ============================================================
// THINK IT. SEE IT. — Demo Brand Kits
// 3 kits representing different brand archetypes
// ============================================================

import type { BrandKit } from "./types";

export const BRAND_KITS: BrandKit[] = [
  {
    id: "kit-bold",
    name: "Challenger",
    description: "High-contrast, provocative, sans-serif. For brands that want to disrupt.",
    colors: {
      primary: [
        { name: "Signal Red", hex: "#FF2D55", usage: "Headlines, CTAs, accent moments" },
        { name: "Midnight", hex: "#0A0A0A", usage: "Primary backgrounds" },
      ],
      secondary: [
        { name: "Electric Blue", hex: "#007AFF", usage: "Supporting accents, data viz" },
        { name: "Neon Green", hex: "#30D158", usage: "Success states, proof points" },
      ],
      neutral: [
        { name: "White", hex: "#FFFFFF", usage: "Body text on dark, backgrounds" },
        { name: "Smoke", hex: "#8E8E93", usage: "Supporting text, captions" },
        { name: "Charcoal", hex: "#1C1C1E", usage: "Card backgrounds" },
      ],
    },
    typography: {
      headingFamily: "Space Grotesk, system-ui, sans-serif",
      bodyFamily: "Inter, system-ui, sans-serif",
      headlineStyle: "Bold, tight tracking, all-caps for scene labels",
    },
    toneOfVoice: {
      personality: ["Bold", "Direct", "Confident", "Provocative"],
      weAre: ["Fearless", "Straight-talking", "Culturally sharp", "Evidence-backed"],
      weAreNot: ["Corporate", "Cautious", "Apologetic", "Jargon-heavy"],
    },
    visualStyle: "High-contrast black backgrounds with neon accents. Bold sans-serif type that breaks the grid. Photography is candid, imperfect, high-energy. Full-bleed hero images. Minimal decoration — the content speaks.",
  },
  {
    id: "kit-premium",
    name: "Premium",
    description: "Muted palette, serif typography, sophisticated. For premium and luxury brands.",
    colors: {
      primary: [
        { name: "Deep Navy", hex: "#1B2A4A", usage: "Headlines, primary backgrounds" },
        { name: "Warm Gold", hex: "#C9A96E", usage: "Accent moments, dividers, highlights" },
      ],
      secondary: [
        { name: "Sage", hex: "#7A8B6F", usage: "Secondary accents, evidence scenes" },
        { name: "Terracotta", hex: "#C4775C", usage: "Warm moments, quotes" },
      ],
      neutral: [
        { name: "Ivory", hex: "#FAF7F2", usage: "Primary backgrounds, breathing space" },
        { name: "Stone", hex: "#9B9590", usage: "Body text, captions" },
        { name: "Graphite", hex: "#3D3835", usage: "Heading text on light backgrounds" },
      ],
    },
    typography: {
      headingFamily: "Georgia, 'Times New Roman', serif",
      bodyFamily: "Inter, system-ui, sans-serif",
      headlineStyle: "Regular weight, generous spacing, sentence case. Let the words breathe.",
    },
    toneOfVoice: {
      personality: ["Sophisticated", "Warm", "Understated", "Confident"],
      weAre: ["Thoughtful", "Considered", "Quietly confident", "Generous with space"],
      weAreNot: ["Loud", "Salesy", "Trendy", "Complicated"],
    },
    visualStyle: "Ivory and navy palette with warm gold accents. Serif headings with generous white space. Photography is cinematic, considered — like stills from an art film. Muted tones, natural light. Generous margins. Every element has room to breathe.",
  },
  {
    id: "kit-cultural",
    name: "Cultural",
    description: "Vibrant, mixed-media, energetic. For brands embedded in culture.",
    colors: {
      primary: [
        { name: "Ultraviolet", hex: "#6C5CE7", usage: "Headlines, primary accent" },
        { name: "Hot Coral", hex: "#FF6B6B", usage: "CTAs, emphasis, energy moments" },
      ],
      secondary: [
        { name: "Electric Teal", hex: "#00CEC9", usage: "Data viz, secondary accent" },
        { name: "Sunshine", hex: "#FECA57", usage: "Highlights, callouts" },
      ],
      neutral: [
        { name: "Near Black", hex: "#0D0D0D", usage: "Primary backgrounds" },
        { name: "Cool Grey", hex: "#B2BEC3", usage: "Body text, supporting" },
        { name: "Off White", hex: "#F5F5F0", usage: "Light mode backgrounds" },
      ],
    },
    typography: {
      headingFamily: "'DM Sans', system-ui, sans-serif",
      bodyFamily: "Inter, system-ui, sans-serif",
      headlineStyle: "Bold, playful sizing — mix large and small for rhythm. Sentence case.",
    },
    toneOfVoice: {
      personality: ["Culturally fluent", "Energetic", "Inclusive", "Playful"],
      weAre: ["First to the trend", "Community-driven", "Visually rich", "Authentic"],
      weAreNot: ["Corporate", "Preachy", "Exclusive", "Slow"],
    },
    visualStyle: "Vibrant, saturated colours on dark backgrounds. Mixed media — photography, illustration, user-generated content. Typography that feels social-native with playful scale contrast. Grid-breaking layouts that feel alive and in motion. Emoji-friendly.",
  },
];

export function getBrandKit(id: string): BrandKit | undefined {
  return BRAND_KITS.find((kit) => kit.id === id);
}
