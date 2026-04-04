"""Base agent class for the Napkin Intelligence Flywheel."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from napkin.models import DataLayer, GeneratedOutput, WikiPage

logger = logging.getLogger("napkin.agents")


class BaseAgent(ABC):
    """Base class for all Napkin agents.

    All agents follow the same contract:
    1. Read wiki (synthesis layer) FIRST
    2. Optionally consult raw memory for grounding
    3. Generate output
    4. Suggest write-back if output is reusable
    """

    name: str = "base"
    description: str = ""
    reads_from: list[str] = []   # wiki directories this agent reads
    writes_to: list[str] = []    # wiki directories this agent can write back to

    def __init__(self, synthesis_layer, raw_memory_layer):
        self.synthesis = synthesis_layer
        self.raw_memory = raw_memory_layer
        self.context_pages: list[WikiPage] = []
        self.raw_context: list[dict] = []

    def run(
        self,
        prompt: str,
        layer: DataLayer = DataLayer.GLOBAL,
        client_id: Optional[str] = None,
    ) -> GeneratedOutput:
        """Execute the agent's workflow.

        INGEST context → SYNTHESIZE with knowledge → GENERATE output
        """
        # Step 1: Gather wiki context (synthesis layer first)
        self.context_pages = self._gather_wiki_context(prompt, layer, client_id)
        logger.info(
            "[%s] Gathered %d wiki pages for context",
            self.name, len(self.context_pages),
        )

        # Step 2: Optionally ground with raw memory
        self.raw_context = self._gather_raw_context(prompt, layer, client_id)
        logger.info(
            "[%s] Gathered %d raw memory chunks for grounding",
            self.name, len(self.raw_context),
        )

        # Step 3: Generate output using both sources
        output_text = self.generate(prompt, self.context_pages, self.raw_context)

        return GeneratedOutput(
            agent=self.name,
            prompt=prompt,
            output=output_text,
            wiki_pages_used=[p.path for p in self.context_pages],
            raw_sources_used=[c.get("source_id", "") for c in self.raw_context],
            layer=layer,
            client_id=client_id,
        )

    def _gather_wiki_context(
        self,
        prompt: str,
        layer: DataLayer,
        client_id: Optional[str],
    ) -> list[WikiPage]:
        """Read relevant wiki pages. Always consult wiki before raw memory."""
        pages = []
        for directory in self.reads_from:
            results = self.synthesis.search_pages(
                query=prompt,
                directory=directory,
                layer=layer,
            )
            pages.extend(results)
        return pages[:10]  # cap context size

    def _gather_raw_context(
        self,
        prompt: str,
        layer: DataLayer,
        client_id: Optional[str],
    ) -> list[dict]:
        """Ground with raw memory — only used when wiki is insufficient."""
        if self.context_pages:
            return []  # wiki had what we needed

        return self.raw_memory.search(
            query=prompt,
            layer=layer,
            client_id=client_id,
            limit=5,
        )

    @abstractmethod
    def generate(
        self,
        prompt: str,
        wiki_context: list[WikiPage],
        raw_context: list[dict],
    ) -> str:
        """Generate output using gathered context.

        In production, this calls an LLM with structured prompts.
        Subclasses implement domain-specific generation.
        """
        ...

    def suggest_write_back(self, output: GeneratedOutput) -> bool:
        """Determine if this output should be written back to the wiki."""
        if len(output.output) < 100:
            return False
        if not output.wiki_pages_used and not output.raw_sources_used:
            return False
        return True
