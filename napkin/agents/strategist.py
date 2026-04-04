"""Strategist Agent — Strategic analysis, brief development, audience insight."""

from __future__ import annotations

from napkin.agents.base import BaseAgent
from napkin.models import WikiPage


class StrategistAgent(BaseAgent):
    name = "strategist"
    description = "Strategic analysis, brief development, audience insight"
    reads_from = ["patterns", "categories", "frameworks", "campaigns"]
    writes_to = ["patterns", "categories", "frameworks"]

    def generate(
        self,
        prompt: str,
        wiki_context: list[WikiPage],
        raw_context: list[dict],
    ) -> str:
        """Generate strategic analysis using wiki knowledge and raw data.

        In production, this sends a structured prompt to an LLM with:
        - The user's strategic question/brief
        - Relevant pattern pages
        - Category insights
        - Framework templates
        - Grounding data from raw memory

        Current implementation demonstrates the knowledge assembly.
        """
        sections = []

        # Build strategic context from wiki
        sections.append("## Strategic Analysis\n")
        sections.append(f"**Brief**: {prompt}\n")

        if wiki_context:
            sections.append("### Relevant Patterns & Frameworks\n")
            for page in wiki_context:
                sections.append(f"- **{page.title}** ({page.path})")
                if page.tags:
                    sections.append(f"  Tags: {', '.join(page.tags)}")
                sections.append(f"  Confidence: {page.confidence.value}\n")

        if raw_context:
            sections.append("### Grounding Evidence\n")
            for chunk in raw_context:
                sections.append(
                    f"- [{chunk['source_type']}] {chunk['source_name']}: "
                    f"{chunk['chunk_text'][:200]}..."
                )

        sections.append("\n### Strategic Recommendation\n")
        sections.append(
            "Based on the accumulated patterns and evidence above, "
            "the following strategic direction is recommended:\n"
        )
        sections.append(
            f"[LLM would generate strategic recommendation here based on "
            f"{len(wiki_context)} wiki pages and {len(raw_context)} raw sources]\n"
        )

        sections.append("### Suggested Write-back\n")
        sections.append(
            "If this analysis reveals new patterns, they should be "
            "extracted and written back to the wiki for future use."
        )

        return "\n".join(sections)
