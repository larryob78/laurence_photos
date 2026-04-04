"""Creative Agent — Idea generation, concept development, script writing."""

from __future__ import annotations

from napkin.agents.base import BaseAgent
from napkin.models import WikiPage


class CreativeAgent(BaseAgent):
    name = "creative"
    description = "Idea generation, concept development, script writing"
    reads_from = ["patterns", "categories", "brands", "playbooks", "campaigns"]
    writes_to = ["patterns", "playbooks"]

    def generate(
        self,
        prompt: str,
        wiki_context: list[WikiPage],
        raw_context: list[dict],
    ) -> str:
        """Generate creative output using accumulated intelligence.

        In production, this sends a structured prompt to an LLM with:
        - The creative brief/prompt
        - Relevant playbooks and patterns
        - Brand guidelines (if client-scoped)
        - Category-specific creative insights
        - Award-winning campaign examples from raw memory

        The key difference from a basic LLM call: this agent
        reads from LEARNED patterns, not just raw data.
        """
        sections = []

        sections.append("## Creative Output\n")
        sections.append(f"**Brief**: {prompt}\n")

        # Assemble creative intelligence
        playbooks = [p for p in wiki_context if "playbooks" in p.path]
        patterns = [p for p in wiki_context if "patterns" in p.path]
        brand_pages = [p for p in wiki_context if "brands" in p.path]

        if playbooks:
            sections.append("### Applicable Playbooks\n")
            for pb in playbooks:
                sections.append(f"- **{pb.title}** — {pb.confidence.value} confidence")

        if patterns:
            sections.append("\n### Creative Patterns to Apply\n")
            for pat in patterns:
                sections.append(f"- {pat.title}")

        if brand_pages:
            sections.append("\n### Brand Context\n")
            for bp in brand_pages:
                sections.append(f"- {bp.title} ({bp.layer.value} layer)")

        if raw_context:
            sections.append("\n### Reference Campaigns\n")
            for chunk in raw_context:
                sections.append(
                    f"- [{chunk['source_type']}] {chunk['source_name']}"
                )

        sections.append("\n### Generated Concepts\n")
        sections.append(
            f"[LLM would generate creative concepts here, informed by "
            f"{len(playbooks)} playbooks, {len(patterns)} patterns, "
            f"{len(brand_pages)} brand pages]\n"
        )

        sections.append("### Write-back Candidates\n")
        sections.append(
            "Any new creative patterns discovered during generation "
            "should be extracted and added to patterns/ for future use."
        )

        return "\n".join(sections)
