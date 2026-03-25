# THINK IT. SEE IT.

A voice-first living presentation system for advertising agencies, creative strategists, founders, and creative teams.

Transform messy spoken or written thinking into structured strategy, persuasive story shapes, creative routes, and scene-based living decks.

## Quick Start

```bash
cd think-it-see-it
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works fully in **demo mode** with no API key. To enable live AI, copy `.env.local.example` to `.env.local` and add your OpenAI API key.

## How It Works

### Pipeline

1. **Input** — Speak or paste your thinking. Voice-first with Web Speech API, or paste text.
2. **Strategic Extraction** — AI extracts 17 structured fields: brief, audience, challenge, insight, opportunity, proposition, market context, idea territories, constraints, unknowns, tone, and more. Each field has a confidence score.
3. **Story Shapes** — Choose from 3 AI-generated narrative structures (e.g., The Challenger Arc, The Cultural Wave, The Evidence Engine).
4. **Creative Routes** — Choose from 3 creative directions on a safe/moderate/bold spectrum. Each with concept, visual world, and tonal register.
5. **Brand Kit** — Optionally apply one of 3 brand kits (Challenger, Premium, Cultural) to influence visual direction and colour palette.
6. **Living Deck** — A scene-based deck generated from the research data foundation. 24 scene types, 8 deck type structures, inline editing, speaker notes, fullscreen presenter mode.

### Research Data Foundation

The AI is powered by 10 research deliverables in `/research/`:

| File | Purpose |
|------|---------|
| `agency_deck_structures.md` | 8 deck types with scene sequences and narrative flows |
| `scene_taxonomy.csv` | 24 scene types with purpose, layout, and positioning |
| `brand_kit_schema.json` | Normalized brand guideline schema |
| `voice_extraction_schema.json` | 17-field extraction model with guidance per field |
| `source_inventory.csv` | 30+ categorized data sources with rights assessments |
| `dataset_schemas.json` | Production schemas for all 10 entities |
| `media_ingestion_model.md` | Asset handling pipelines |
| `quality_rubric.md` | 10-dimension quality evaluation framework |
| `product_moat.md` | Defensibility analysis |
| `mvp_dataset_plan.md` | Minimum viable dataset plan |

## Tech Stack

- **Next.js 14** App Router with TypeScript
- **Zustand** for state management
- **Framer Motion** for animations
- **Web Speech API** for voice input
- **Tailwind CSS** for styling
- **Lucide Icons** for iconography

## Architecture

```
src/
├── app/              # Next.js pages and API routes
│   ├── api/          # AI pipeline: analyze, story-shapes, creative-routes, generate-deck
│   └── page.tsx      # Main app — stage-based routing
├── components/
│   ├── stages/       # InputStage, AnalyzingStage, StoryShapesStage, CreativeRoutesStage, GeneratingDeckStage
│   ├── deck/         # DeckStage, SceneCard (inline editing), DeckPresenter (fullscreen)
│   ├── voice/        # VoicePulse animation
│   ├── ExtractionDisplay.tsx  # Rich extraction with expandable deep fields
│   └── ProgressBar.tsx
├── hooks/            # useVoiceInput (Web Speech API)
├── lib/
│   ├── types.ts      # Full type system (24 scene types, 8 deck types, deep extraction)
│   ├── prompts.ts    # AI prompts informed by research
│   ├── brand-kits.ts # 3 demo brand kits
│   ├── scene-taxonomy.ts # Scene type metadata and deck type sequences
│   └── ai-client.ts  # Browser-side API client
├── store/
│   └── project-store.ts # Zustand store
research/             # 10 research deliverables (see above)
```

## Features

- Voice input with live transcript and pulse animation
- 17-field strategic extraction with confidence scoring
- Expandable extraction display with idea territories, proof points, constraints, unknowns
- 3 story shape options with narrative arc visualization
- 3 creative routes with safe/moderate/bold risk spectrum
- 3 brand kits with live colour swatches
- Pitch deck vs workshop deck format toggle
- 8 deck type structures with correct scene sequences
- 24 scene types with semantic labels and colours
- Inline scene editing with headline, subheadline, body, speaker notes
- Scene deletion with automatic reorder
- Grid and list view modes
- Fullscreen presenter mode with keyboard navigation
- JSON export
- Back navigation between all stages
- Demo mode with curated mock data (no API key needed)

## Deployment

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
npx vercel
```
