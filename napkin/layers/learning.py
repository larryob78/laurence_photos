"""Learning Layer — Write-back system for compounding intelligence.

Captures useful outputs, converts them into reusable knowledge,
and updates existing wiki pages or creates new ones.

This is what makes the flywheel spin: every use improves the system.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from napkin.models import (
    Confidence,
    DataLayer,
    EvaluationResult,
    GeneratedOutput,
    LogEntry,
    Pattern,
    WikiPage,
)

logger = logging.getLogger("napkin.learning")


class LearningLayer:
    """Write-back system that converts outputs into reusable knowledge.

    Only stores outputs that are:
    - Reusable across contexts
    - Structured and well-formed
    - Meaningful (not trivial)
    - Supported by evidence or clearly marked as interpretation
    """

    def __init__(self, synthesis_layer, raw_memory_layer):
        self.synthesis = synthesis_layer
        self.raw_memory = raw_memory_layer
        self.write_back_threshold = 0.6  # minimum quality score for write-back
        logger.info("Learning layer initialized")

    def evaluate_output(self, output: GeneratedOutput, feedback: str = "") -> EvaluationResult:
        """Evaluate a generated output for quality, usefulness, and reusability.

        In production, this would use LLM evaluation.
        Current implementation uses heuristic scoring.
        """
        quality = self._score_quality(output)
        usefulness = self._score_usefulness(output)
        novelty = self._score_novelty(output)
        reusable = (quality + usefulness + novelty) / 3 >= self.write_back_threshold

        result = EvaluationResult(
            output_id=output.id,
            quality_score=quality,
            usefulness_score=usefulness,
            novelty_score=novelty,
            reusable=reusable,
            feedback=feedback,
        )

        output.evaluation = result
        logger.info(
            "Evaluated output %s: quality=%.2f, useful=%.2f, novel=%.2f, reusable=%s",
            output.id[:8], quality, usefulness, novelty, reusable,
        )
        return result

    def write_back(self, output: GeneratedOutput, patterns: list[Pattern]) -> list[str]:
        """Write evaluated output back into the wiki as reusable knowledge.

        Returns list of wiki page paths that were created or updated.
        """
        if not output.evaluation or not output.evaluation.reusable:
            logger.info("Output %s not eligible for write-back", output.id[:8])
            return []

        affected_pages = []

        for pattern in patterns:
            if pattern.confidence == Confidence.LOW:
                continue

            page_path = self._pattern_to_page_path(pattern)
            existing = self.synthesis.get_page(page_path)

            if existing:
                updated = self._merge_pattern_into_page(existing, pattern)
                self.synthesis.write_page(updated)
                logger.info("Updated existing page: %s", page_path)
            else:
                new_page = self._create_pattern_page(pattern)
                self.synthesis.write_page(new_page)
                logger.info("Created new page: %s", page_path)

            affected_pages.append(page_path)

        self.synthesis.log_change(LogEntry(
            action="write_back",
            summary=f"Write-back from {output.agent} agent output",
            source=f"output:{output.id[:8]}",
            pages_affected=affected_pages,
            layer=output.layer,
            confidence=Confidence.MEDIUM,
        ))

        return affected_pages

    def promote_insight(
        self,
        insight: str,
        from_layer: DataLayer,
        to_layer: DataLayer,
        category: str = "",
        tags: list[str] | None = None,
    ) -> Optional[str]:
        """Promote an insight from a lower layer to a higher one.

        CRITICAL: Client insights must be abstracted/generalized before
        promotion to category or global layers.
        """
        if from_layer == DataLayer.CLIENT and to_layer != DataLayer.CLIENT:
            if not self._is_properly_abstracted(insight):
                logger.warning("Blocked promotion: insight contains client-specific data")
                return None

        page = WikiPage(
            path=f"patterns/{self._slugify(insight[:60])}.md",
            title=insight[:80],
            content=f"# {insight[:80]}\n\n{insight}\n",
            layer=to_layer,
            tags=tags or [],
            confidence=Confidence.MEDIUM,
        )
        if category:
            page.tags.append(category)

        self.synthesis.write_page(page)

        self.synthesis.log_change(LogEntry(
            action="promote",
            summary=f"Promoted insight from {from_layer.value} to {to_layer.value}",
            source="learning_layer",
            pages_affected=[page.path],
            layer=to_layer,
        ))

        logger.info("Promoted insight to %s: %s", to_layer.value, insight[:50])
        return page.path

    def _score_quality(self, output: GeneratedOutput) -> float:
        """Score output quality (0-1). Heuristic for now."""
        score = 0.5
        if len(output.output) > 200:
            score += 0.1
        if len(output.wiki_pages_used) > 0:
            score += 0.2  # used existing knowledge
        if output.output.count("\n") > 3:
            score += 0.1  # structured output
        return min(score, 1.0)

    def _score_usefulness(self, output: GeneratedOutput) -> float:
        """Score usefulness (0-1)."""
        score = 0.5
        if output.wiki_pages_used:
            score += 0.15
        if output.raw_sources_used:
            score += 0.15
        if len(output.output) > 100:
            score += 0.1
        return min(score, 1.0)

    def _score_novelty(self, output: GeneratedOutput) -> float:
        """Score novelty by checking if similar content already exists."""
        words = output.output.split()[:10]
        query = " ".join(words)
        existing = self.synthesis.search_pages(query, directory="patterns")
        if not existing:
            return 0.8  # novel
        return max(0.2, 0.8 - 0.15 * len(existing))

    def _is_properly_abstracted(self, insight: str) -> bool:
        """Check if an insight has been properly abstracted from client data.

        Returns False if it contains likely client-specific references.
        """
        lower = insight.lower()
        red_flags = [
            "their campaign", "the client", "they reported",
            "internal data shows", "confidential",
        ]
        return not any(flag in lower for flag in red_flags)

    def _pattern_to_page_path(self, pattern: Pattern) -> str:
        slug = self._slugify(pattern.insight[:60])
        if pattern.vertical:
            return f"categories/{self._slugify(pattern.vertical)}/{slug}.md"
        return f"patterns/{slug}.md"

    def _create_pattern_page(self, pattern: Pattern) -> WikiPage:
        content = (
            f"# {pattern.insight[:80]}\n\n"
            f"{pattern.insight}\n\n"
            f"## Evidence\n\n"
        )
        for ev in pattern.evidence:
            content += f"- {ev}\n"

        content += (
            f"\n## Metadata\n\n"
            f"- Category: {pattern.category}\n"
            f"- Vertical: {pattern.vertical or 'general'}\n"
            f"- Times validated: {pattern.times_validated}\n"
        )

        return WikiPage(
            path=self._pattern_to_page_path(pattern),
            title=pattern.insight[:80],
            content=content,
            layer=DataLayer.GLOBAL if not pattern.vertical else DataLayer.CATEGORY,
            tags=[pattern.category] if pattern.category else [],
            confidence=pattern.confidence,
        )

    def _merge_pattern_into_page(self, page: WikiPage, pattern: Pattern) -> WikiPage:
        """Merge new pattern evidence into an existing page."""
        for ev in pattern.evidence:
            if ev not in page.content:
                page.content += f"\n- {ev}"
        page.confidence = max(page.confidence, pattern.confidence, key=lambda c: ["low", "medium", "high"].index(c.value))
        return page

    def _slugify(self, text: str) -> str:
        import re
        slug = re.sub(r"[^\w\s-]", "", text.lower())
        slug = re.sub(r"[\s_]+", "-", slug)
        return slug.strip("-")[:80]
