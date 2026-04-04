"""Production Agent — Production planning, asset specification, delivery guidance."""

from __future__ import annotations

from napkin.agents.base import BaseAgent
from napkin.models import WikiPage


class ProductionAgent(BaseAgent):
    name = "production"
    description = "Production planning, asset specification, delivery guidance"
    reads_from = ["playbooks", "frameworks", "campaigns", "brands"]
    writes_to = ["playbooks", "frameworks"]

    def generate(
        self,
        prompt: str,
        wiki_context: list[WikiPage],
        raw_context: list[dict],
    ) -> str:
        """Generate production specs using learned frameworks.

        In production, this sends a structured prompt to an LLM with:
        - The production request
        - Relevant playbooks (format, channel, deliverables)
        - Production frameworks (timelines, budgets, specs)
        - Past campaign production data
        - Brand-specific production guidelines
        """
        sections = []

        sections.append("## Production Plan\n")
        sections.append(f"**Request**: {prompt}\n")

        frameworks = [p for p in wiki_context if "frameworks" in p.path]
        playbooks = [p for p in wiki_context if "playbooks" in p.path]

        if frameworks:
            sections.append("### Applicable Frameworks\n")
            for fw in frameworks:
                sections.append(f"- **{fw.title}** (v{fw.version})")

        if playbooks:
            sections.append("\n### Production Playbooks\n")
            for pb in playbooks:
                sections.append(f"- {pb.title}")

        if raw_context:
            sections.append("\n### Reference Production Data\n")
            for chunk in raw_context:
                sections.append(f"- [{chunk['source_type']}] {chunk['source_name']}")

        sections.append("\n### Production Specification\n")
        sections.append(
            f"[LLM would generate production spec here, informed by "
            f"{len(frameworks)} frameworks and {len(playbooks)} playbooks]\n"
        )

        return "\n".join(sections)
