"""Napkin Intelligence Flywheel — Core Orchestrator.

INGEST -> SYNTHESIZE -> STORE -> USE -> EVALUATE -> UPDATE -> REPEAT

This orchestrator ties all layers together and drives the flywheel loop.
Every input and every output improves the system permanently.
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from napkin.agents.creative import CreativeAgent
from napkin.agents.production import ProductionAgent
from napkin.agents.strategist import StrategistAgent
from napkin.extractors.pattern_extractor import PatternExtractor
from napkin.layers.learning import LearningLayer
from napkin.layers.raw_memory import RawMemoryLayer
from napkin.layers.synthesis import SynthesisLayer
from napkin.lint import WikiLinter
from napkin.models import (
    Confidence,
    DataLayer,
    FlyweelStage,
    GeneratedOutput,
    LogEntry,
    Source,
)

logger = logging.getLogger("napkin.flywheel")


class Flywheel:
    """The Napkin Intelligence Flywheel.

    This is NOT a RAG system. This is NOT a note-taking tool.
    This is a compounding intelligence system that:
    - Learns continuously from every interaction
    - Structures knowledge for reuse
    - Improves creative output over time
    - Protects proprietary insights via layer separation
    - Becomes more valuable with every use
    """

    def __init__(
        self,
        wiki_root: str | Path = "wiki",
        db_path: str | Path = "napkin_raw.db",
    ):
        # Layer 1: Raw Memory
        self.raw_memory = RawMemoryLayer(db_path)

        # Layer 2: Synthesis (Wiki)
        self.synthesis = SynthesisLayer(wiki_root)

        # Layer 3: Agents
        self.agents = {
            "strategist": StrategistAgent(self.synthesis, self.raw_memory),
            "creative": CreativeAgent(self.synthesis, self.raw_memory),
            "production": ProductionAgent(self.synthesis, self.raw_memory),
        }

        # Layer 4: Learning (Write-back)
        self.learning = LearningLayer(self.synthesis, self.raw_memory)

        # Pattern Extraction
        self.extractor = PatternExtractor(self.synthesis, self.raw_memory)

        # Lint
        self.linter = WikiLinter(self.synthesis)

        # Stats
        self.cycle_count = 0
        self.total_patterns_extracted = 0
        self.total_write_backs = 0

        logger.info("Flywheel initialized — ready to compound intelligence")

    # === STAGE 1: INGEST ===

    def ingest(self, source: Source) -> dict:
        """INGEST: New sources enter the system.

        1. Store raw source in memory
        2. Extract patterns
        3. Update wiki pages
        4. Create new pages if needed
        5. Link related concepts
        6. Log the change
        """
        logger.info("=== INGEST: %s [%s] ===", source.name, source.source_type)

        # Store in raw memory
        source_id = self.raw_memory.ingest(source)

        # Extract patterns (SYNTHESIZE)
        patterns = self.extractor.extract_from_source(source)

        # Store patterns in wiki (STORE)
        affected_pages = self.extractor.store_patterns(patterns)
        self.total_patterns_extracted += len(patterns)

        # Log the ingest
        self.synthesis.log_change(LogEntry(
            action="ingest",
            summary=f"Ingested {source.name} ({source.source_type}), extracted {len(patterns)} patterns",
            source=f"source:{source_id[:8]}",
            pages_affected=affected_pages,
            layer=source.layer,
            confidence=Confidence.MEDIUM,
        ))

        return {
            "source_id": source_id,
            "patterns_extracted": len(patterns),
            "pages_affected": affected_pages,
            "stage": FlyweelStage.INGEST.value,
        }

    # === STAGE 4: USE ===

    def query(
        self,
        prompt: str,
        agent_name: str = "strategist",
        layer: DataLayer = DataLayer.GLOBAL,
        client_id: Optional[str] = None,
    ) -> GeneratedOutput:
        """USE: Agents use knowledge to generate outputs.

        1. Read relevant wiki pages FIRST
        2. Use raw sources only for grounding
        3. Avoid recomputing known insights
        4. Generate output
        5. Suggest write-back if useful
        """
        logger.info("=== QUERY: [%s] %s ===", agent_name, prompt[:60])

        agent = self.agents.get(agent_name)
        if not agent:
            raise ValueError(f"Unknown agent: {agent_name}. Available: {list(self.agents.keys())}")

        # Agent reads wiki first, then raw memory
        output = agent.run(prompt, layer, client_id)

        # Check if output should be written back
        if agent.suggest_write_back(output):
            logger.info("Output eligible for write-back — running evaluation")
            self._evaluate_and_write_back(output)

        return output

    # === STAGE 5 & 6: EVALUATE & UPDATE ===

    def _evaluate_and_write_back(self, output: GeneratedOutput):
        """EVALUATE & UPDATE: Review output and write back insights.

        1. Evaluate quality, usefulness, novelty
        2. Extract patterns from the output
        3. Write reusable knowledge back to wiki
        """
        # Evaluate
        evaluation = self.learning.evaluate_output(output)

        if not evaluation.reusable:
            return

        # Extract patterns from the output itself
        patterns = self.extractor.extract_from_output(output.output, output.agent)

        # Write back
        if patterns:
            affected = self.learning.write_back(output, patterns)
            self.total_write_backs += len(affected)
            logger.info("Write-back complete: %d pages updated", len(affected))

        self.cycle_count += 1

    # === FULL CYCLE ===

    def run_cycle(
        self,
        prompt: str,
        agent_name: str = "strategist",
        layer: DataLayer = DataLayer.GLOBAL,
        client_id: Optional[str] = None,
    ) -> dict:
        """Run a complete flywheel cycle:
        INGEST -> SYNTHESIZE -> STORE -> USE -> EVALUATE -> UPDATE

        This is the core loop. Every call makes the system smarter.
        """
        logger.info("=== FLYWHEEL CYCLE %d ===", self.cycle_count + 1)

        # USE: Generate output
        output = self.query(prompt, agent_name, layer, client_id)

        return {
            "cycle": self.cycle_count,
            "agent": agent_name,
            "output": output.output,
            "wiki_pages_used": output.wiki_pages_used,
            "raw_sources_used": output.raw_sources_used,
            "total_patterns": self.total_patterns_extracted,
            "total_write_backs": self.total_write_backs,
        }

    # === LINT ===

    def lint(self) -> str:
        """Run wiki health checks and return report."""
        logger.info("=== LINT ===")
        self.linter.run_all()
        return self.linter.format_report()

    # === STATUS ===

    def status(self) -> dict:
        """Get current flywheel status."""
        return {
            "raw_memory_sources": self.raw_memory.count(),
            "wiki_pages": len(self.synthesis.list_pages()),
            "patterns": len(self.synthesis.list_pages("patterns")),
            "categories": len(self.synthesis.list_pages("categories")),
            "brands": len(self.synthesis.list_pages("brands")),
            "campaigns": len(self.synthesis.list_pages("campaigns")),
            "playbooks": len(self.synthesis.list_pages("playbooks")),
            "frameworks": len(self.synthesis.list_pages("frameworks")),
            "flywheel_cycles": self.cycle_count,
            "total_patterns_extracted": self.total_patterns_extracted,
            "total_write_backs": self.total_write_backs,
            "tags": self.synthesis.get_all_tags(),
        }

    def close(self):
        """Clean shutdown."""
        self.raw_memory.close()
        logger.info("Flywheel shut down cleanly")
