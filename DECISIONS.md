# NAPKIN A2A - Architecture Decisions

## ADR-001: Next.js 15 with App Router
**Decision:** Use Next.js 15 with the App Router and Server Components.
**Rationale:** Server components reduce client bundle size. Server actions provide a clean API layer without separate backend. App Router is the future of Next.js.

## ADR-002: SQLite via Drizzle ORM
**Decision:** Use SQLite with better-sqlite3 and Drizzle ORM.
**Rationale:** SQLite is zero-config, embedded, and fast for single-server deployments. Drizzle provides type-safe queries with minimal overhead. WAL mode enables concurrent reads. Can migrate to PostgreSQL later if needed.

## ADR-003: Bloomberg Terminal Aesthetic
**Decision:** Dark-only UI with data-dense Bloomberg Terminal visual language.
**Rationale:** The target user is a brand strategist or agency professional who values information density. The dark theme communicates seriousness and technical sophistication. Green-on-black evokes financial terminals and real-time data systems.

## ADR-004: Tailwind CSS v4 with Custom Color Tokens
**Decision:** Use Tailwind v4 CSS-based configuration with inline @theme tokens.
**Rationale:** Tailwind v4 moves configuration to CSS, reducing config file complexity. Custom color tokens (accent, data, alert, etc.) create a semantic color system that maps to the application domain.

## ADR-005: Zustand for Client State
**Decision:** Use Zustand for client-side state management.
**Rationale:** Lightweight, TypeScript-native, no providers needed. Perfect for managing UI state alongside server-fetched data from Next.js server components.

## ADR-006: Anthropic Claude as Primary AI Backend
**Decision:** Use Claude (via @anthropic-ai/sdk) for all AI operations including visibility audits, data card generation, and negotiation simulation.
**Rationale:** Claude is the primary AI model we're optimizing for. Using it directly lets us test how brands appear in real Claude responses. This is both the audit tool and the audit target.

## ADR-007: ASOv (AI Share of Voice) as Core Metric
**Decision:** Define a composite ASOv metric spanning three layers: citation (L1), selection (L2), and preference (L3).
**Rationale:** No standard metric exists for measuring brand visibility in AI responses. ASOv fills this gap and becomes the core value proposition of the platform. The three-layer model maps to the gap map framework.

## ADR-008: Monorepo Single App Architecture
**Decision:** Keep everything in a single Next.js app rather than microservices.
**Rationale:** Speed of development. The product is pre-PMF and needs rapid iteration. Server actions replace API routes for most operations. Can decompose later if scale demands it.

## ADR-009: Eight Specialized AI Agents
**Decision:** Decompose platform intelligence into 8 specialized agent modules: Scout (brand audit), Card Builder (JSON-LD), Dealer (A2A negotiation), Seeder (preference campaigns), Media Agent (platform planning), Trust Agent (claims verification + attestation), CD Brain (creative scoring), and Conductor (orchestration + ARB score).
**Rationale:** Each agent has a distinct responsibility and can be tested, evolved, and scaled independently. The Conductor orchestrates cross-agent workflows. All agents share a common Claude API helper for consistent LLM interaction.

## ADR-010: HMAC-SHA256 for Attestation Signatures
**Decision:** Use Node.js crypto HMAC-SHA256 for brand data card hashing and attestation signatures.
**Rationale:** Provides tamper-evident signatures without requiring PKI infrastructure. The ATTESTATION_SECRET env var controls the signing key. W3C Verifiable Credential format ensures interoperability with decentralized identity standards.

## ADR-011: Cannes Rubric for Creative Quality Gate
**Decision:** CD Brain uses a Cannes Lions-inspired rubric (Insight + Craft + Impact, 0-10 each) with a 24/30 approval threshold.
**Rationale:** Provides an objective, industry-recognized framework for content quality. The threshold ensures only shortlist-quality content passes. Below-threshold content receives specific, actionable fixes rather than vague feedback.

## ADR-012: ARB Score Composite Metric
**Decision:** The Agent Readiness Benchmark (ARB) score uses weighted layers: Semantic (25%), Action (30%), Trust (25%), Governance (20%).
**Rationale:** Captures the full spectrum of brand readiness for AI commerce. Action layer gets the highest weight because conversion capability is the most direct revenue driver. Each layer maps to specific agent modules enabling targeted gap remediation.

## ADR-013: Next.js 15 App Router API Routes
**Decision:** All API endpoints implemented as Next.js 15 App Router route handlers (route.ts files) under src/app/api/brands/.
**Rationale:** Co-locates API logic with the frontend. App Router route handlers support async params (Promise<{ id: string }>), which aligns with Next.js 15's async API design. Each route file exports named HTTP method handlers (GET, POST, PUT, DELETE).

## ADR-014: Brand Autocomplete via Single Claude Call
**Decision:** The /api/brands/autocomplete endpoint generates all brand data (description, personality, competitors, audit queries, offer rules, trust claims, governance policies, and JSON-LD data card) in a single Claude API call with max_tokens 8192.
**Rationale:** One API call instead of eight reduces latency and cost. The structured prompt with explicit JSON schema ensures consistent output. This is the killer onboarding feature - enter a brand name and category, get everything.

## ADR-015: Battlefield Batch Negotiation Pattern
**Decision:** The /api/brands/[id]/battlefield endpoint runs negotiations sequentially with 200ms delays between each.
**Rationale:** Sequential execution with small delays prevents rate limiting on the Claude API while still allowing batch operations. Results are collected and returned as a single array for battlefield visualization.
