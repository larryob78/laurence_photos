"""Pattern Extractor Agent — Extracts generalized insights from data.

This is the core of the flywheel: it converts specific observations
into generalized, reusable creative intelligence.

BAD: "Lucozade campaign performed well"
GOOD: "High-tempo chaotic humour performs strongly in youth-oriented
       energy drink campaigns when paired with rapid visual escalation"
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Optional

from napkin.models import Confidence, DataLayer, LogEntry, Pattern, Source, WikiPage

logger = logging.getLogger("napkin.extractors")


class PatternExtractor:
    """Extracts generalized creative patterns from campaigns and outputs.

    Input: campaign data, generated output, performance signals
    Output: generalized insights + wiki page updates

    Rules:
    - NEVER store client-specific data in global patterns
    - ALWAYS abstract before promoting
    - Only promote meaningful, reusable insights
    """

    def __init__(self, synthesis_layer, raw_memory_layer):
        self.synthesis = synthesis_layer
        self.raw_memory = raw_memory_layer

    def extract_from_source(self, source: Source) -> list[Pattern]:
        """Extract patterns from a raw source (campaign, research, etc.).

        In production, this uses an LLM to:
        1. Read the source content
        2. Identify creative patterns
        3. Generalize them (remove client specifics)
        4. Structure as Pattern objects

        Current implementation demonstrates the extraction pipeline.
        """
        patterns = []

        # Extract based on source type
        if source.source_type in ("cannes", "effies", "ipa", "dad"):
            patterns.extend(self._extract_from_award_data(source))
        elif source.source_type == "brand_material":
            patterns.extend(self._extract_from_brand(source))
        elif source.source_type == "generated":
            patterns.extend(self._extract_from_output(source))

        # Filter: only keep properly abstracted patterns
        filtered = []
        for p in patterns:
            if self._is_generalized(p):
                filtered.append(p)
            else:
                logger.warning(
                    "Blocked pattern (not generalized): %s", p.insight[:60]
                )

        logger.info(
            "Extracted %d patterns from source %s (%d filtered out)",
            len(filtered), source.name, len(patterns) - len(filtered),
        )
        return filtered

    def extract_from_output(self, output_text: str, agent_name: str) -> list[Pattern]:
        """Extract patterns from a generated output.

        This runs after every agent generates output, looking for
        new patterns that should be stored for future use.
        """
        patterns = []

        # In production, LLM analyzes the output for:
        # - New creative techniques used
        # - Structural patterns in the output
        # - Category-specific insights
        # - Reusable frameworks or approaches

        # Heuristic extraction for demonstration
        lines = output_text.split("\n")
        for line in lines:
            line = line.strip()
            if self._looks_like_insight(line):
                patterns.append(Pattern(
                    insight=line,
                    category=self._infer_category(line),
                    confidence=Confidence.LOW,  # auto-extracted = low confidence
                ))

        return patterns

    def store_patterns(self, patterns: list[Pattern]) -> list[str]:
        """Store extracted patterns in the wiki. Returns list of page paths."""
        affected_pages = []

        for pattern in patterns:
            page_path = self._find_or_create_page(pattern)
            affected_pages.append(page_path)

        if affected_pages:
            self.synthesis.log_change(LogEntry(
                action="extract",
                summary=f"Extracted {len(patterns)} patterns",
                source="pattern_extractor",
                pages_affected=affected_pages,
                layer=DataLayer.GLOBAL,
            ))

        return affected_pages

    def validate_pattern(self, pattern: Pattern, new_evidence: str) -> Pattern:
        """Validate an existing pattern with new evidence.

        Each validation increases confidence and times_validated count.
        This is how patterns become stronger over time.
        """
        pattern.evidence.append(new_evidence)
        pattern.times_validated += 1
        pattern.updated_at = datetime.now().isoformat()

        if pattern.times_validated >= 3:
            pattern.confidence = Confidence.HIGH
        elif pattern.times_validated >= 1:
            pattern.confidence = Confidence.MEDIUM

        logger.info(
            "Validated pattern (%dx): %s",
            pattern.times_validated, pattern.insight[:50],
        )
        return pattern

    def _extract_from_award_data(self, source: Source) -> list[Pattern]:
        """Extract patterns from award-winning campaign data."""
        patterns = []
        content = source.content.lower()

        # Pattern categories to look for
        creative_signals = {
            "humour": ["humour", "humor", "funny", "comedy", "wit", "playful"],
            "emotion": ["emotion", "emotional", "moving", "touching", "empathy"],
            "disruption": ["disrupt", "unexpected", "subvert", "challenge", "bold"],
            "storytelling": ["story", "narrative", "character", "journey", "arc"],
            "visual": ["visual", "aesthetic", "design", "cinematic", "beautiful"],
            "social": ["social", "viral", "share", "community", "participation"],
            "purpose": ["purpose", "cause", "impact", "change", "sustainability"],
            "data": ["data", "insight", "research", "audience", "personaliz"],
            "cultural": ["culture", "cultural", "zeitgeist", "moment", "trend"],
            "craft": ["craft", "production", "quality", "detail", "execution"],
        }

        for category, signals in creative_signals.items():
            hits = sum(1 for s in signals if s in content)
            if hits >= 2:
                patterns.append(Pattern(
                    insight=f"[LLM would generate generalized insight about {category} "
                            f"patterns found in {source.source_type} data]",
                    category=category,
                    vertical=source.metadata.get("vertical", ""),
                    evidence=[f"Source: {source.name} ({source.source_type})"],
                    confidence=Confidence.MEDIUM,
                ))

        return patterns

    def _extract_from_brand(self, source: Source) -> list[Pattern]:
        """Extract patterns from brand materials (private layer)."""
        return [Pattern(
            insight=f"[LLM would extract brand-specific patterns from {source.name}]",
            category="brand",
            evidence=[f"Brand material: {source.name}"],
            confidence=Confidence.LOW,
        )]

    def _extract_from_output(self, source: Source) -> list[Pattern]:
        """Extract patterns from previously generated outputs."""
        return [Pattern(
            insight=f"[LLM would extract reusable patterns from generated output]",
            category="generated",
            evidence=[f"Generated output: {source.name}"],
            confidence=Confidence.LOW,
        )]

    def _is_generalized(self, pattern: Pattern) -> bool:
        """Check if a pattern is properly generalized (no client specifics)."""
        lower = pattern.insight.lower()
        client_specific_flags = [
            "their brand", "the client's", "confidential",
            "internal only", "do not share",
        ]
        return not any(flag in lower for flag in client_specific_flags)

    def _looks_like_insight(self, line: str) -> bool:
        """Heuristic: does this line look like a creative insight?"""
        if len(line) < 30:
            return False
        insight_indicators = [
            "performs", "effective", "pattern", "technique",
            "approach", "strategy", "works when", "resonates",
        ]
        return any(ind in line.lower() for ind in insight_indicators)

    def _infer_category(self, text: str) -> str:
        """Infer the pattern category from text."""
        categories = {
            "humour": ["humour", "humor", "funny", "comedy"],
            "emotion": ["emotion", "moving", "touching"],
            "visual": ["visual", "design", "aesthetic"],
            "storytelling": ["story", "narrative"],
            "social": ["social", "viral", "community"],
            "disruption": ["disrupt", "unexpected", "bold"],
        }
        lower = text.lower()
        for cat, signals in categories.items():
            if any(s in lower for s in signals):
                return cat
        return "general"

    def _find_or_create_page(self, pattern: Pattern) -> str:
        """Find an existing page for this pattern or create a new one."""
        slug = re.sub(r"[^\w\s-]", "", pattern.insight.lower())
        slug = re.sub(r"[\s_]+", "-", slug)[:80].strip("-")

        if pattern.vertical:
            page_path = f"categories/{pattern.vertical}/{slug}.md"
        else:
            page_path = f"patterns/{slug}.md"

        existing = self.synthesis.get_page(page_path)
        if existing:
            # Merge new evidence into existing page
            self.synthesis.update_page(
                page_path,
                f"\n- {pattern.evidence[0] if pattern.evidence else 'auto-extracted'}",
                append=True,
            )
            return page_path

        new_page = WikiPage(
            path=page_path,
            title=pattern.insight[:80],
            content=(
                f"# {pattern.insight[:80]}\n\n"
                f"{pattern.insight}\n\n"
                f"## Evidence\n\n"
                + "\n".join(f"- {e}" for e in pattern.evidence)
                + f"\n\n## Metadata\n\n"
                f"- Category: {pattern.category}\n"
                f"- Vertical: {pattern.vertical or 'general'}\n"
                f"- Confidence: {pattern.confidence.value}\n"
            ),
            layer=DataLayer.CATEGORY if pattern.vertical else DataLayer.GLOBAL,
            tags=[pattern.category] if pattern.category else [],
            confidence=pattern.confidence,
        )
        self.synthesis.write_page(new_page)
        return page_path
