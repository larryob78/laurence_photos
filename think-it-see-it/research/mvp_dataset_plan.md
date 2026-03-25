# MVP Dataset Plan

> The minimum realistic dataset and extraction package needed to get THINK IT. SEE IT. working well.

---

## PHILOSOPHY

The MVP does not need a large training dataset. It needs:
1. **Well-defined taxonomies** so the AI knows what to generate
2. **High-quality exemplars** so the prompts have reference points
3. **Structural patterns** baked into the prompt engineering
4. **User feedback loops** from day one to start building the moat

The AI (GPT-4o / Claude) already knows how to write strategy and copy. What it lacks is **agency-specific structural knowledge**. The dataset provides that structure.

---

## 1. DECK EXEMPLARS

### Minimum: 15–20 exemplar deck structures

Not full decks with content — just the **structural patterns** (scene sequences, scene types, narrative flows).

| Deck Type | Exemplars Needed | Source |
|-----------|-----------------|--------|
| Pitch | 4 | Internal agency decks (redacted) or hand-authored |
| Strategy | 3 | Internal or hand-authored |
| Campaign | 3 | Internal or hand-authored |
| Credentials | 2 | Internal or hand-authored |
| Workshop | 2 | Internal or hand-authored |
| Innovation | 2 | Internal or hand-authored |
| Case Study | 2 | Internal or hand-authored |
| Keynote | 2 | Internal or hand-authored |

**What each exemplar contains:**
```json
{
  "deckType": "pitch",
  "name": "Pitch Exemplar A — Challenger Brand",
  "totalScenes": 18,
  "scenes": [
    { "order": 1, "sceneType": "cover", "purpose": "Set tone" },
    { "order": 2, "sceneType": "brief", "purpose": "Show we listened" },
    ...
  ],
  "narrativeFlow": "Reframe → Diagnose → Unlock → Solve → Land",
  "openingPattern": "empathy-open",
  "proofDensity": "moderate",
  "routeCount": 3,
  "visualIntensity": "high"
}
```

**Priority:** Pitch and Campaign exemplars are most important — they're the most requested deck types.

### How to create them
Option A: Extract from 15–20 real internal decks (redact content, keep structure only)
Option B: Hand-author based on the agency_deck_structures.md research
Option C: Hybrid — start with research, validate against real decks

**Recommendation:** Option C. Hand-author from research, then validate against 5–10 real decks.

---

## 2. SCENE EXEMPLARS

### Minimum: 3–5 exemplars per scene type

The scene_taxonomy.csv defines 24 scene types. Each needs 3–5 content exemplars showing what great output looks like.

**Total: ~100 scene exemplars**

Each exemplar:
```json
{
  "sceneType": "insight",
  "headline": "People don't want to be healthy. They want to feel in control.",
  "subheadline": "The wellness category has been selling the wrong thing.",
  "bodyText": "Our research across 3,000 consumers found that health is not the primary motivator. Control is. The brands winning in this space are the ones that frame their product as a tool for agency, not a prescription for wellness.",
  "visualDirection": "Single figure standing at a crossroads, shot from above. Muted palette except for a single colour accent on the path they choose. Serif headline, generous white space.",
  "speakerNotes": "This is the pivot slide. Pause after the headline. Let it land. Then deliver the supporting evidence slowly.",
  "layout": "centred",
  "copyDensity": "low"
}
```

**Priority scene types (need 5 exemplars):**
- cover, insight, challenge, proposition, route_reveal, idea_board, closing

**Standard scene types (need 3 exemplars):**
- intro, brief, audience, strategy, opportunity, execution, results, quote

**Lower priority (need 2 exemplars):**
- overview, market_context, media_plan, timeline, production, budget, case_study, provocation, exercise, divider

### How to create them
Hand-author by an experienced strategist/writer. These are the "gold standard" outputs the AI should aspire to.

---

## 3. BRAND KITS

### Minimum: 3 brand kits

| Kit | Purpose |
|-----|---------|
| **Kit A: Bold/Disruptive** | High-contrast, sans-serif, provocative tone. Represents challenger brands. |
| **Kit B: Premium/Sophisticated** | Muted palette, serif typography, warm and confident tone. Represents luxury/professional brands. |
| **Kit C: Energetic/Cultural** | Vibrant colours, mixed typography, culturally fluent tone. Represents youth/lifestyle brands. |

These are **fictional brand kits** that demonstrate the system's ability to adapt output to different brand identities. They also serve as defaults for demo mode.

Each kit follows the `brand_kit_schema.json` structure.

---

## 4. MEDIA ASSETS

### Minimum: 50–100 assets

| Category | Count | Source | Purpose |
|----------|-------|--------|---------|
| Abstract backgrounds | 10 | Unsplash (free) | Scene backgrounds for demo |
| People photography | 15 | Unsplash/Pexels | Audience scenes, case studies |
| Urban/landscape | 10 | Unsplash/Pexels | Mood and atmosphere |
| Data visualizations | 5 | Hand-created | Evidence and results scenes |
| Icons | 30+ | Lucide (already included) | Scene decoration, navigation |
| Brand mark samples | 3 | Custom-created for demo kits | Logo placement demos |

**All media must be properly licensed.** Use Unsplash License or Pexels License only. Create original assets where possible.

---

## 5. EDIT TRACES

### Minimum at launch: 0 (but capture from day one)

Edit traces are **generated by usage**, not pre-created. However, the system must:

1. **Capture edit traces from the very first user session**
2. Start with a schema that captures all the signals identified in the moat analysis
3. Store traces even before there's an analytics pipeline — data lost is data lost forever

### Seed data (optional)
If you want the system to feel smart from day one, you could:
- Have 3–5 team members use the product for 1 week before launch
- Capture their edit traces as seed data
- Use the patterns to improve initial prompt quality

**Estimated seed: 50–100 edit sessions, generating ~500–1000 individual edit traces**

---

## 6. MINIMUM VIABLE TAXONOMIES

These must be complete and correct at launch:

| Taxonomy | Items | Status |
|----------|-------|--------|
| **Deck types** | 8 (pitch, strategy, campaign, credentials, innovation, workshop, case-study, keynote) | Defined in agency_deck_structures.md |
| **Scene types** | 24 (cover through closing) | Defined in scene_taxonomy.csv |
| **Story shape presets** | 5–8 (challenger, cultural-wave, evidence-engine, hero's-journey, problem-solution, before-after, tension-release, three-act) | Partially defined in app; needs completion |
| **Layout types** | 7 (centred, split-left, split-right, full-bleed, editorial, grid, dashboard) | Defined in dataset_schemas.json |
| **Scene transitions** | 5 (fade, slide, zoom, cut, morph) | Defined in dataset_schemas.json |
| **Deck formats** | 3 (living, pitch, workshop) | Defined in app |
| **Tone attributes** | 20+ common attributes | Needs creation |
| **Risk levels** | 3 (safe, moderate, bold) | Defined |
| **Quality dimensions** | 10 | Defined in quality_rubric.md |

### Tone Attributes Taxonomy (needs creation)

Minimum 20 attributes, organized as spectrums:

| Spectrum | Low End | High End |
|----------|---------|----------|
| Formality | Casual | Formal |
| Energy | Calm | Energetic |
| Warmth | Cool/Detached | Warm/Human |
| Bravery | Safe/Conservative | Bold/Provocative |
| Complexity | Simple/Direct | Nuanced/Layered |
| Authority | Peer/Collaborative | Expert/Authoritative |
| Humour | Serious | Playful |
| Inclusivity | Exclusive/Elite | Universal/Accessible |

Each attribute should have 3–5 example descriptors.

---

## 7. PRIORITY ORDER

If resources are limited, build in this order:

### Must Have (Week 1)
1. Deck type taxonomy (8 types) — **DONE** (agency_deck_structures.md)
2. Scene type taxonomy (24 types) — **DONE** (scene_taxonomy.csv)
3. Voice extraction schema — **DONE** (voice_extraction_schema.json)
4. 3 pitch deck structural exemplars
5. 5 scene exemplars for critical scene types (insight, challenge, proposition, route_reveal, closing)

### Should Have (Week 2)
6. Complete deck structural exemplars (all 20)
7. Complete scene exemplars (all 100)
8. 3 brand kits
9. Quality rubric integrated into evaluation — **DONE** (quality_rubric.md)
10. Tone attributes taxonomy

### Nice to Have (Week 3+)
11. 50+ media assets catalogued
12. Edit trace capture pipeline
13. Seed edit trace data from internal testing
14. Story shape presets with arc visualization data

---

## 8. WHAT THIS DATASET DOES NOT INCLUDE (AND WHY)

| Not Included | Reason |
|-------------|--------|
| Real client decks | Legal risk. Use structural patterns only. |
| Copyrighted campaign images | Licensing. Use free/open sources. |
| Competitor product data | Ethically questionable. Build from first principles. |
| Large language model training data | Not needed. We use existing LLMs via API. |
| Scraped presentation content | Legal risk. Hand-author exemplars instead. |

---

## 9. DATA MAINTENANCE

The dataset is a living system. Plan for:

- **Monthly review** of scene exemplars based on edit trace analysis
- **Quarterly update** of deck structures based on agency trends
- **Continuous capture** of edit traces, route selections, and export events
- **Annual review** of brand kit schema as brand guidelines evolve
- **Ongoing curation** of source inventory as new resources emerge

---

## TOTAL MVP DATASET SIZE

| Asset | Count | Effort |
|-------|-------|--------|
| Deck structural exemplars | 20 | 2–3 days (hand-authored) |
| Scene content exemplars | 100 | 5–7 days (hand-authored by strategist/writer) |
| Brand kits | 3 | 1–2 days |
| Media assets | 50–100 | 1 day (curated from free sources) |
| Taxonomies | 6 complete | Already done |
| Schemas | 10 | Already done |
| Edit traces | 0 (capture from launch) | Pipeline setup: 1 day |

**Total estimated effort: 10–14 working days for a senior strategist + product designer.**

This is achievable. This is practical. This is enough to make a first product that works well.

---

*Document version: 1.0*
