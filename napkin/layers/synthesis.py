"""Synthesis Layer — LLM Wiki: the core intelligence layer.

Markdown-based structured knowledge containing patterns, categories,
brands, campaigns, frameworks. This is where intelligence compounds.
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from napkin.models import Confidence, DataLayer, LogEntry, WikiPage

logger = logging.getLogger("napkin.synthesis")


class SynthesisLayer:
    """Manages the wiki — Napkin's structured knowledge base.

    All knowledge compounding happens through this layer.
    Pages are markdown files organized by type and layer.
    """

    def __init__(self, wiki_root: str | Path = "wiki"):
        self.wiki_root = Path(wiki_root)
        self._ensure_structure()
        self._log_path = self.wiki_root / "log.md"
        logger.info("Synthesis layer initialized: %s", self.wiki_root)

    def _ensure_structure(self):
        """Ensure wiki directory structure exists."""
        for subdir in ["patterns", "categories", "brands", "campaigns", "playbooks", "frameworks"]:
            (self.wiki_root / subdir).mkdir(parents=True, exist_ok=True)

    def get_page(self, path: str) -> Optional[WikiPage]:
        """Read a wiki page by its relative path."""
        full_path = self.wiki_root / path
        if not full_path.exists():
            return None

        content = full_path.read_text(encoding="utf-8")
        meta = self._parse_frontmatter(content)

        return WikiPage(
            id=meta.get("id", ""),
            path=path,
            title=meta.get("title", path),
            content=content,
            layer=DataLayer(meta.get("layer", "global")),
            tags=meta.get("tags", []),
            links=meta.get("links", []),
            confidence=Confidence(meta.get("confidence", "medium")),
            created_at=meta.get("created_at", ""),
            updated_at=meta.get("updated_at", ""),
            version=int(meta.get("version", 1)),
            source_ids=meta.get("source_ids", []),
        )

    def write_page(self, page: WikiPage) -> str:
        """Write or update a wiki page. Returns the path."""
        full_path = self.wiki_root / page.path
        full_path.parent.mkdir(parents=True, exist_ok=True)

        page.updated_at = datetime.now().isoformat()
        if not page.created_at:
            page.created_at = page.updated_at

        existing = self.get_page(page.path)
        if existing:
            page.version = existing.version + 1

        content = self._build_page_content(page)
        full_path.write_text(content, encoding="utf-8")
        logger.info("Wrote wiki page: %s (v%d)", page.path, page.version)
        return page.path

    def update_page(self, path: str, new_content: str, append: bool = False) -> Optional[WikiPage]:
        """Update an existing page's content section."""
        page = self.get_page(path)
        if not page:
            logger.warning("Page not found for update: %s", path)
            return None

        if append:
            body = self._extract_body(page.content)
            new_body = body.rstrip() + "\n\n" + new_content
            page.content = self._replace_body(page.content, new_body)
        else:
            page.content = new_content

        self.write_page(page)
        return page

    def search_pages(
        self,
        query: str,
        directory: Optional[str] = None,
        layer: Optional[DataLayer] = None,
        tags: Optional[list[str]] = None,
    ) -> list[WikiPage]:
        """Search wiki pages by content and metadata."""
        results = []
        search_root = self.wiki_root / directory if directory else self.wiki_root
        query_lower = query.lower()

        for md_file in search_root.rglob("*.md"):
            rel_path = str(md_file.relative_to(self.wiki_root))
            if rel_path in ("index.md", "log.md", "AGENTS.md"):
                continue

            content = md_file.read_text(encoding="utf-8")
            if query_lower not in content.lower():
                continue

            page = self.get_page(rel_path)
            if not page:
                continue

            if layer and page.layer != layer:
                continue
            if tags and not any(t in page.tags for t in tags):
                continue

            results.append(page)

        return results

    def list_pages(self, directory: Optional[str] = None) -> list[str]:
        """List all wiki page paths in a directory."""
        search_root = self.wiki_root / directory if directory else self.wiki_root
        return sorted(
            str(f.relative_to(self.wiki_root))
            for f in search_root.rglob("*.md")
            if f.name not in ("index.md", "log.md", "AGENTS.md")
        )

    def find_related(self, page_path: str) -> list[WikiPage]:
        """Find pages related to a given page via tags and links."""
        page = self.get_page(page_path)
        if not page:
            return []

        related = []
        for tag in page.tags:
            for result in self.search_pages(tag):
                if result.path != page_path and result not in related:
                    related.append(result)

        for link in page.links:
            linked = self.get_page(link)
            if linked and linked.path != page_path:
                related.append(linked)

        return related

    def log_change(self, entry: LogEntry):
        """Append a change entry to the flywheel log."""
        log_entry = (
            f"\n## [{entry.timestamp}] {entry.action.upper()} — {entry.summary}\n"
            f"- **Source**: {entry.source}\n"
            f"- **Pages affected**: {', '.join(entry.pages_affected) or 'none'}\n"
            f"- **Layer**: {entry.layer.value}\n"
            f"- **Confidence**: {entry.confidence.value}\n"
        )

        content = self._log_path.read_text(encoding="utf-8")
        marker = "<!-- Entries are prepended below this line -->"
        content = content.replace(marker, marker + "\n" + log_entry)
        self._log_path.write_text(content, encoding="utf-8")
        logger.debug("Logged change: %s — %s", entry.action, entry.summary)

    def get_all_tags(self) -> dict[str, int]:
        """Get all tags across the wiki with counts."""
        tag_counts: dict[str, int] = {}
        for md_file in self.wiki_root.rglob("*.md"):
            content = md_file.read_text(encoding="utf-8")
            meta = self._parse_frontmatter(content)
            for tag in meta.get("tags", []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        return tag_counts

    def _parse_frontmatter(self, content: str) -> dict:
        """Parse YAML-like frontmatter from markdown."""
        match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        if not match:
            return {}

        meta = {}
        for line in match.group(1).splitlines():
            line = line.strip()
            if ":" not in line:
                continue
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()

            if value.startswith("[") and value.endswith("]"):
                items = value[1:-1].split(",")
                meta[key] = [item.strip().strip("'\"") for item in items if item.strip()]
            elif value.isdigit():
                meta[key] = int(value)
            else:
                meta[key] = value.strip("'\"")
        return meta

    def _extract_body(self, content: str) -> str:
        """Extract body content (after frontmatter)."""
        match = re.match(r"^---\n.*?\n---\n(.*)", content, re.DOTALL)
        return match.group(1) if match else content

    def _replace_body(self, content: str, new_body: str) -> str:
        """Replace body content while preserving frontmatter."""
        match = re.match(r"^(---\n.*?\n---\n)", content, re.DOTALL)
        if match:
            return match.group(1) + new_body
        return new_body

    def _build_page_content(self, page: WikiPage) -> str:
        """Build full markdown page with frontmatter."""
        body = self._extract_body(page.content) if "---" in page.content else page.content

        frontmatter = (
            f"---\n"
            f"id: {page.id}\n"
            f"title: {page.title}\n"
            f"layer: {page.layer.value}\n"
            f"tags: [{', '.join(page.tags)}]\n"
            f"links: [{', '.join(page.links)}]\n"
            f"confidence: {page.confidence.value}\n"
            f"created_at: {page.created_at}\n"
            f"updated_at: {page.updated_at}\n"
            f"version: {page.version}\n"
            f"source_ids: [{', '.join(page.source_ids)}]\n"
            f"---\n"
        )
        return frontmatter + body
