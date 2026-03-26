# Product Moat Analysis

> What data and workflow layers become proprietary and defensible over time.

---

## MOAT THESIS

THINK IT. SEE IT.'s defensibility does not come from AI (any competitor can call GPT-4). It comes from **accumulated knowledge about how real agency professionals think, edit, select, and present.** Every user interaction deposits data that makes the system smarter — and this data cannot be replicated without the same user base.

---

## 1. EDIT TRACES — THE PRIMARY MOAT

### What it is
Every edit a user makes is recorded: which headlines they rewrite, which scenes they delete, which routes they choose, how they reorder scenes, what they change before a client meeting.

### Why it's defensible
- Edit traces reveal the **gap between AI-generated output and professional-quality output**
- Over thousands of edits, patterns emerge: "When the brief is X and the audience is Y, users always change the AI's headline from Z to W"
- This data is **impossible to acquire without the product being used** — it doesn't exist in any public dataset
- Competitors cannot access this without building and scaling their own product first

### How it compounds
- Month 1: Raw edit data — interesting but sparse
- Month 6: Patterns in edit behaviour by deck type, audience type, industry
- Year 1: Predictive models — the system starts suggesting edits before the user makes them
- Year 2: The system generates output that needs fewer edits, creating a measurable productivity moat

### Data schema signals to capture
- Field-level edit frequency (which fields get edited most?)
- Edit direction (do users make headlines shorter or longer? More or less provocative?)
- Scene deletion patterns (which AI-generated scene types get cut?)
- Scene addition patterns (what scenes do users add that the AI missed?)
- Reordering patterns (where does the AI get the sequence wrong?)
- Time-to-edit (how long does each scene take to refine?)
- A/B of route selection (which routes get chosen? what characteristics do winning routes have?)

---

## 2. PROJECT HISTORIES — VERTICAL KNOWLEDGE

### What it is
The complete history of how projects evolve: from raw voice input through extraction, story shape selection, route selection, deck generation, editing, and final output.

### Why it's defensible
- Each project is a **complete end-to-end workflow record** — from messy thinking to polished deck
- Industry-specific patterns emerge: "Healthcare pitch decks follow different patterns from FMCG campaigns"
- Client-specific patterns: "This client always wants evidence-heavy, 3 routes, workshop format"
- Seasonal and cyclical patterns: "Q1 pitches tend to be budget-conscious, Q3 pitches are more ambitious"

### How it compounds
- The system learns which extraction patterns lead to the best decks
- The system learns which story shapes perform best for which brief types
- The system learns which creative routes get selected and why
- Eventually: the system can predict the right deck structure before the user selects anything

---

## 3. ROUTE SELECTION DATA — CREATIVE INTELLIGENCE

### What it is
When the system generates 3 creative routes, the user's choice is a signal. Over time, this builds a model of **what creative directions win for what contexts.**

### Why it's defensible
- This is essentially a **dataset of creative taste and judgement** — the most subjective and hard-to-acquire signal in the industry
- No public dataset captures "given this brief and this strategy, which creative direction did a senior strategist choose?"
- Competitive intelligence: which creative approaches are trending? Which are fatiguing?

### Pattern signals
- Route risk preference by industry (tech = bold, healthcare = safe?)
- Route risk preference by deck type (pitch = bold, workshop = moderate?)
- Visual world preferences by audience type
- Tonal register preferences by brand category
- Winning route characteristics (length of concept? specificity of visual world? emotional vs. rational?)

---

## 4. SUCCESSFUL DECK PATTERNS — OUTCOME DATA

### What it is
If the product captures any downstream signal — user rating, "presented successfully" flag, client feedback, or even simple "did the user export and present this deck?" — it becomes an outcome-linked dataset.

### Why it's defensible
- Most AI products generate output with no feedback loop. A "did you present this?" signal closes the loop.
- Over time: the system knows not just what users create but **what actually works in the real world**
- This is the holy grail: a dataset linking brief → extraction → structure → creative → outcome

### Signals to capture (progressive)
- **Implicit:** Did the user export the deck? (Signal: good enough to use)
- **Implicit:** Did the user return to edit after exporting? (Signal: needed revision)
- **Explicit (optional):** "How did it go?" — simple 1–5 rating after the presentation date
- **Explicit (optional):** "Did the client approve the route?" — binary outcome signal
- **Future:** Integration with meeting tools (did the deck get screen-shared?)

---

## 5. BRAND BEHAVIOUR MODELS — CLIENT LOCK-IN

### What it is
As brands use the system repeatedly, the system builds a model of their brand — not just the static brand kit, but the **dynamic behavioural model** of how the brand actually presents.

### Why it's defensible
- Static brand guidelines (logo, colours, fonts) are commodity
- **Brand behaviour** (how they structure arguments, what tone they use, what proof level they need, which scene types they prefer) is proprietary knowledge that builds over time
- Switching cost: another tool would start with zero brand knowledge

### What the model captures
- Preferred deck structures per occasion type
- Tone calibration (how formal? how provocative?)
- Proof density preference
- Visual complexity preference
- Scene type frequency (this brand loves "provocation" scenes, this one never uses them)
- Vocabulary patterns (words the brand uses, words it avoids)

---

## 6. SCENE COMPOSITION PATTERNS — CRAFT KNOWLEDGE

### What it is
How individual scenes are composed — the relationship between headline length, body text density, visual direction specificity, and scene type.

### Why it's defensible
- This is **micro-level craft knowledge** — the kind of thing a senior designer or strategist knows intuitively but has never been codified
- Examples: "Insight scenes work best with 4–7 word headlines and no body text" or "Budget scenes need grid layouts, never centred"
- This compounds across all users — every edit to every scene contributes

### Patterns
- Optimal headline length by scene type
- Optimal body text length by deck format
- Visual direction specificity by scene type (title scenes: vague is fine; execution scenes: specific is required)
- Layout preference by scene type
- Colour accent patterns by scene mood

---

## 7. TEAM USAGE PATTERNS — COLLABORATION INTELLIGENCE

### What it is
How teams collaborate on decks — who initiates, who edits, who presents, how many revision cycles, how projects flow between team members.

### Why it's defensible (post-MVP)
- Workflow intelligence: "Strategy decks initiated by planners get better quality scores than those initiated by account managers" — this drives product design
- Team dynamics: "Decks with 2–3 editors are higher quality than solo-authored or 5+ editor decks" — this drives collaboration features
- Role-based needs: different roles need different things from the same tool

---

## MOAT TIMELINE

| Timeframe | Moat Depth | Primary Data Layer |
|-----------|-----------|-------------------|
| Month 1–3 | Shallow | Basic edit traces and route selections |
| Month 3–6 | Growing | Scene composition patterns, deck type preferences |
| Month 6–12 | Meaningful | Brand behaviour models, outcome-linked patterns |
| Year 1–2 | Strong | Predictive quality, cross-industry creative intelligence |
| Year 2+ | Deep | The system generates output so good that the edit gap shrinks, creating a quality moat that competitors with less data can't match |

---

## COMPETITIVE DEFENSE SUMMARY

| Competitor Action | Our Defense |
|-------------------|-------------|
| Copy the UI | UI is not the moat. The data behind the decisions is. |
| Use the same LLMs | Same LLM + no edit traces = worse output quality. |
| Build similar templates | Templates are static. Our scene compositions learn from real usage. |
| Raise more money | Money can't buy edit trace data — it requires usage at scale. |
| Partner with agencies | Agencies will go where the output is best, and our output improves with every use. |

---

## WHAT MUST BE TRUE FOR THE MOAT TO WORK

1. **Edit traces must be captured from day one** — this is the most important data pipeline in the product
2. **Route selection must be logged** — even in MVP, record which route the user chose
3. **Scene-level edits must be granular** — field-level, not just "scene was modified"
4. **Export events must be tracked** — the closest proxy for "this deck was used"
5. **Brand kits must be reusable across projects** — this creates brand behaviour models
6. **The system must visibly improve** — users need to feel the product getting smarter

---

*Document version: 1.0*
