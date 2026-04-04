"""Lint system — Knowledge base health maintenance.

Regularly checks for:
- Duplicate pages
- Weak insights (low confidence, no evidence)
- Missing links between related pages
- Contradictions
- Stale content
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from napkin.models import Confidence, DataLayer, LogEntry

logger = logging.getLogger("napkin.lint")


class LintIssue:
    def __init__(self, severity: str, category: str, page: str, message: str):
        self.severity = severity  # error, warning, info
        self.category = category  # duplicate, weak, missing_link, contradiction, stale
        self.page = page
        self.message = message

    def __repr__(self):
        return f"[{self.severity.upper()}] {self.category}: {self.page} — {self.message}"


class WikiLinter:
    """Checks wiki health and suggests improvements.

    A healthy wiki means better agent outputs, which means
    better patterns extracted, which means a smarter wiki.
    """

    def __init__(self, synthesis_layer):
        self.synthesis = synthesis_layer
        self.issues: list[LintIssue] = []

    def run_all(self) -> list[LintIssue]:
        """Run all lint checks and return issues found."""
        self.issues = []

        self._check_duplicates()
        self._check_weak_insights()
        self._check_missing_links()
        self._check_stale_content()
        self._check_orphan_pages()
        self._check_empty_directories()
        self._check_layer_violations()

        # Sort: errors first, then warnings, then info
        severity_order = {"error": 0, "warning": 1, "info": 2}
        self.issues.sort(key=lambda i: severity_order.get(i.severity, 3))

        logger.info(
            "Lint complete: %d issues (%d errors, %d warnings, %d info)",
            len(self.issues),
            sum(1 for i in self.issues if i.severity == "error"),
            sum(1 for i in self.issues if i.severity == "warning"),
            sum(1 for i in self.issues if i.severity == "info"),
        )

        # Log the lint run
        self.synthesis.log_change(LogEntry(
            action="lint",
            summary=f"Lint found {len(self.issues)} issues",
            source="wiki_linter",
            pages_affected=[i.page for i in self.issues[:10]],
            layer=DataLayer.GLOBAL,
            confidence=Confidence.HIGH,
        ))

        return self.issues

    def _check_duplicates(self):
        """Find pages with very similar titles or content."""
        pages = {}
        for page_path in self.synthesis.list_pages():
            page = self.synthesis.get_page(page_path)
            if not page:
                continue

            title_key = re.sub(r"[^\w]", "", page.title.lower())
            if title_key in pages:
                self.issues.append(LintIssue(
                    severity="warning",
                    category="duplicate",
                    page=page_path,
                    message=f"Possible duplicate of {pages[title_key]}",
                ))
            else:
                pages[title_key] = page_path

    def _check_weak_insights(self):
        """Find pages with low confidence and no evidence."""
        for page_path in self.synthesis.list_pages("patterns"):
            page = self.synthesis.get_page(page_path)
            if not page:
                continue

            if page.confidence == Confidence.LOW and "## Evidence" in page.content:
                evidence_section = page.content.split("## Evidence")[-1]
                evidence_lines = [
                    l for l in evidence_section.split("\n")
                    if l.strip().startswith("-")
                ]
                if len(evidence_lines) < 1:
                    self.issues.append(LintIssue(
                        severity="warning",
                        category="weak",
                        page=page_path,
                        message="Low confidence pattern with no evidence — consider removing or strengthening",
                    ))

    def _check_missing_links(self):
        """Find pages that share tags but aren't linked."""
        tag_pages: dict[str, list[str]] = {}
        for page_path in self.synthesis.list_pages():
            page = self.synthesis.get_page(page_path)
            if not page:
                continue
            for tag in page.tags:
                tag_pages.setdefault(tag, []).append(page_path)

        for tag, paths in tag_pages.items():
            if len(paths) < 2:
                continue
            for i, p1 in enumerate(paths):
                page1 = self.synthesis.get_page(p1)
                if not page1:
                    continue
                for p2 in paths[i + 1:]:
                    if p2 not in page1.links:
                        self.issues.append(LintIssue(
                            severity="info",
                            category="missing_link",
                            page=p1,
                            message=f"Shares tag '{tag}' with {p2} but no link exists",
                        ))

    def _check_stale_content(self, days_threshold: int = 90):
        """Find pages that haven't been updated in a long time."""
        cutoff = (datetime.now() - timedelta(days=days_threshold)).isoformat()
        for page_path in self.synthesis.list_pages():
            page = self.synthesis.get_page(page_path)
            if not page or not page.updated_at:
                continue
            if page.updated_at < cutoff:
                self.issues.append(LintIssue(
                    severity="info",
                    category="stale",
                    page=page_path,
                    message=f"Not updated since {page.updated_at[:10]}",
                ))

    def _check_orphan_pages(self):
        """Find pages that no other page links to."""
        all_links = set()
        all_pages = set()
        for page_path in self.synthesis.list_pages():
            all_pages.add(page_path)
            page = self.synthesis.get_page(page_path)
            if page:
                all_links.update(page.links)

        orphans = all_pages - all_links
        for orphan in orphans:
            self.issues.append(LintIssue(
                severity="info",
                category="orphan",
                page=orphan,
                message="No other page links to this page",
            ))

    def _check_empty_directories(self):
        """Check for wiki directories with no pages."""
        for subdir in ["patterns", "categories", "brands", "campaigns", "playbooks", "frameworks"]:
            pages = self.synthesis.list_pages(subdir)
            if not pages:
                self.issues.append(LintIssue(
                    severity="info",
                    category="empty_dir",
                    page=subdir,
                    message=f"Directory {subdir}/ has no pages yet",
                ))

    def _check_layer_violations(self):
        """Check for client data that may have leaked to global/category layers."""
        for page_path in self.synthesis.list_pages():
            page = self.synthesis.get_page(page_path)
            if not page:
                continue

            if page.layer in (DataLayer.GLOBAL, DataLayer.CATEGORY):
                content_lower = page.content.lower()
                client_flags = [
                    "confidential", "internal only", "client:",
                    "nda", "do not share",
                ]
                for flag in client_flags:
                    if flag in content_lower:
                        self.issues.append(LintIssue(
                            severity="error",
                            category="layer_violation",
                            page=page_path,
                            message=f"Possible client data in {page.layer.value} layer (found '{flag}')",
                        ))
                        break

    def format_report(self) -> str:
        """Format lint issues as a readable report."""
        if not self.issues:
            return "Wiki health check: All clear. No issues found."

        lines = [
            "# Wiki Health Report",
            f"\nRun: {datetime.now().isoformat()}",
            f"Total issues: {len(self.issues)}\n",
        ]

        by_severity = Counter(i.severity for i in self.issues)
        for sev in ["error", "warning", "info"]:
            if sev in by_severity:
                lines.append(f"- {sev.upper()}: {by_severity[sev]}")

        lines.append("")
        for issue in self.issues:
            icon = {"error": "X", "warning": "!", "info": "i"}[issue.severity]
            lines.append(f"[{icon}] **{issue.category}** — `{issue.page}`")
            lines.append(f"    {issue.message}\n")

        return "\n".join(lines)
