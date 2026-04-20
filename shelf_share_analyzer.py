#!/usr/bin/env python3
"""SHELF SHARE ANALYZER — brand share-of-shelf from shop photos via Claude vision."""
import argparse, base64, json, mimetypes, sys
from pathlib import Path

try:
    from anthropic import Anthropic
except ImportError:
    sys.exit("pip install anthropic")

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You analyse shop shelf photos and report brand share-of-shelf.

For each horizontal shelf visible:
1. Number shelves top-to-bottom (shelf_1 is topmost).
2. Estimate the total pixel width of the shelf strip in the image (left-most
   product to right-most product, ignoring shelf ends cut off by the frame).
3. Walk left-to-right and segment the shelf into brand-owned runs.
4. For each brand, report the approximate cumulative pixel width its products
   occupy on that shelf.

Brand naming rules:
- Use the brand as printed (e.g. "Coca-Cola", "Fanta", "San Pellegrino",
  "M&S Blends", "M&S Lemonade", "M&S Ginger Beer", "Jooj").
- Group unlabelled store-own items under the store brand when obvious
  (e.g. "M&S"). Use "Unknown" only when unreadable.
- Exclude price labels, shelf edges, empty gaps — only count product facings.
- Be consistent across shelves in the same image.

Return ONLY valid JSON, no prose, no markdown fences:
{
  "shelves": [
    {
      "shelf": "shelf_1",
      "total_width_px": 1400,
      "brands": [
        {"brand": "M&S Lemonade", "width_px": 320},
        {"brand": "Coca-Cola",    "width_px": 180}
      ]
    }
  ]
}
"""


def load_image(path: Path) -> dict:
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    data = base64.standard_b64encode(path.read_bytes()).decode("ascii")
    return {"type": "image", "source": {"type": "base64", "media_type": mime, "data": data}}


def strip_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip().rstrip("`").strip()
    return raw


def analyze(client: Anthropic, image_path: Path) -> dict:
    msg = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{
            "role": "user",
            "content": [
                load_image(image_path),
                {"type": "text", "text": "Analyse this shelf photo. Return JSON only."},
            ],
        }],
    )
    text = "".join(b.text for b in msg.content if b.type == "text")
    return json.loads(strip_fences(text))


def summarize(result: dict) -> str:
    lines = []
    grand_total = sum(s["total_width_px"] for s in result["shelves"]) or 1
    agg: dict[str, int] = {}
    for shelf in result["shelves"]:
        total = shelf["total_width_px"] or 1
        lines.append(f"\n{shelf['shelf']}  (~{total}px wide)")
        for b in sorted(shelf["brands"], key=lambda x: -x["width_px"]):
            pct = 100 * b["width_px"] / total
            lines.append(f"  {b['brand']:<26} {b['width_px']:>5}px  {pct:5.1f}%")
            agg[b["brand"]] = agg.get(b["brand"], 0) + b["width_px"]
    lines.append("\nOverall share-of-shelf:")
    for brand, w in sorted(agg.items(), key=lambda x: -x[1]):
        lines.append(f"  {brand:<26}          {100 * w / grand_total:5.1f}%")
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="Measure brand share-of-shelf from shop photos.")
    ap.add_argument("images", nargs="+", type=Path)
    ap.add_argument("--json", action="store_true", help="print raw JSON only")
    args = ap.parse_args()

    client = Anthropic()
    for path in args.images:
        if not path.is_file():
            print(f"skip (not a file): {path}", file=sys.stderr)
            continue
        result = analyze(client, path)
        if args.json:
            print(json.dumps({"image": str(path), **result}, indent=2))
        else:
            print(f"\n=== {path.name} ===")
            print(summarize(result))


if __name__ == "__main__":
    main()
