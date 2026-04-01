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
