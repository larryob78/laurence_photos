#!/usr/bin/env python3
"""Napkin Intelligence Flywheel — CLI Entry Point.

Usage:
    python -m napkin.cli ingest --name "Cannes 2024" --type cannes --file data.txt
    python -m napkin.cli query --agent strategist "What makes youth campaigns effective?"
    python -m napkin.cli query --agent creative "Generate concepts for an energy drink launch"
    python -m napkin.cli lint
    python -m napkin.cli status
    python -m napkin.cli cycle --agent creative "Bold social-first campaign for Gen Z"
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from napkin.flywheel import Flywheel
from napkin.models import DataLayer, Source


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(name)-24s | %(levelname)-7s | %(message)s",
        datefmt="%H:%M:%S",
    ))
    logging.root.setLevel(level)
    logging.root.addHandler(handler)


def cmd_ingest(flywheel: Flywheel, args) -> dict:
    """Ingest a new source into the flywheel."""
    content = ""
    if args.file:
        content = Path(args.file).read_text(encoding="utf-8")
    elif args.content:
        content = args.content
    else:
        content = sys.stdin.read()

    layer = DataLayer(args.layer) if args.layer else DataLayer.GLOBAL

    source = Source(
        name=args.name,
        source_type=args.type,
        content=content,
        metadata=json.loads(args.metadata) if args.metadata else {},
        layer=layer,
        client_id=args.client,
    )

    result = flywheel.ingest(source)
    return result


def cmd_query(flywheel: Flywheel, args) -> dict:
    """Query an agent."""
    layer = DataLayer(args.layer) if args.layer else DataLayer.GLOBAL
    output = flywheel.query(
        prompt=args.prompt,
        agent_name=args.agent,
        layer=layer,
        client_id=args.client,
    )
    return {
        "agent": output.agent,
        "output": output.output,
        "wiki_pages_used": output.wiki_pages_used,
        "raw_sources_used": output.raw_sources_used,
    }


def cmd_cycle(flywheel: Flywheel, args) -> dict:
    """Run a full flywheel cycle."""
    layer = DataLayer(args.layer) if args.layer else DataLayer.GLOBAL
    return flywheel.run_cycle(
        prompt=args.prompt,
        agent_name=args.agent,
        layer=layer,
        client_id=args.client,
    )


def cmd_lint(flywheel: Flywheel, args) -> str:
    """Run wiki health checks."""
    return flywheel.lint()


def cmd_status(flywheel: Flywheel, args) -> dict:
    """Get flywheel status."""
    return flywheel.status()


def main():
    parser = argparse.ArgumentParser(
        description="Napkin Intelligence Flywheel — Compounding Creative Intelligence",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s ingest --name "Cannes Lions 2024" --type cannes --file cannes_data.txt
  %(prog)s query --agent strategist "What creative patterns win in automotive?"
  %(prog)s query --agent creative "Generate a bold social campaign for Gen Z"
  %(prog)s cycle --agent creative "Disruptive energy drink launch concept"
  %(prog)s lint
  %(prog)s status
        """,
    )
    parser.add_argument("--wiki", default="wiki", help="Wiki root directory")
    parser.add_argument("--db", default="napkin_raw.db", help="Raw memory database path")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # ingest
    p_ingest = subparsers.add_parser("ingest", help="Ingest a new source")
    p_ingest.add_argument("--name", required=True, help="Source name")
    p_ingest.add_argument("--type", required=True,
                          choices=["cannes", "ipa", "effies", "dad", "brand_material", "generated", "research"],
                          help="Source type")
    p_ingest.add_argument("--file", help="File to ingest")
    p_ingest.add_argument("--content", help="Content string to ingest")
    p_ingest.add_argument("--metadata", help="JSON metadata string")
    p_ingest.add_argument("--layer", choices=["global", "category", "client"], default="global")
    p_ingest.add_argument("--client", help="Client ID (required for client layer)")

    # query
    p_query = subparsers.add_parser("query", help="Query an agent")
    p_query.add_argument("prompt", help="The query prompt")
    p_query.add_argument("--agent", default="strategist",
                         choices=["strategist", "creative", "production"],
                         help="Agent to use")
    p_query.add_argument("--layer", choices=["global", "category", "client"], default="global")
    p_query.add_argument("--client", help="Client ID")

    # cycle
    p_cycle = subparsers.add_parser("cycle", help="Run a full flywheel cycle")
    p_cycle.add_argument("prompt", help="The cycle prompt")
    p_cycle.add_argument("--agent", default="strategist",
                         choices=["strategist", "creative", "production"],
                         help="Agent to use")
    p_cycle.add_argument("--layer", choices=["global", "category", "client"], default="global")
    p_cycle.add_argument("--client", help="Client ID")

    # lint
    subparsers.add_parser("lint", help="Run wiki health checks")

    # status
    subparsers.add_parser("status", help="Show flywheel status")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    setup_logging(args.verbose)
    flywheel = Flywheel(wiki_root=args.wiki, db_path=args.db)

    try:
        if args.command == "ingest":
            result = cmd_ingest(flywheel, args)
        elif args.command == "query":
            result = cmd_query(flywheel, args)
        elif args.command == "cycle":
            result = cmd_cycle(flywheel, args)
        elif args.command == "lint":
            result = cmd_lint(flywheel, args)
        elif args.command == "status":
            result = cmd_status(flywheel, args)
        else:
            parser.print_help()
            sys.exit(1)

        if isinstance(result, str):
            print(result)
        else:
            print(json.dumps(result, indent=2))

    finally:
        flywheel.close()


if __name__ == "__main__":
    main()
