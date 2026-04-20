#!/usr/bin/env python3
"""Flask UI for the shelf share analyzer. Use --mock for a credential-free demo."""
import argparse, os, sys
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
_client = None


def is_mock() -> bool:
    return os.environ.get("SHELF_MOCK") == "1"


def get_client():
    global _client
    if _client is None:
        try:
            from anthropic import Anthropic
        except ImportError:
            raise RuntimeError("anthropic SDK not installed — run with --mock or pip install anthropic")
        _client = Anthropic()
    return _client


MOCK_RESULT = {
    "shelves": [
        {
            "shelf": "shelf_1", "total_width_px": 1480,
            "brands": [
                {"brand": "M&S Lemonade",     "width_px": 320},
                {"brand": "M&S Ginger Beer",  "width_px": 180},
                {"brand": "M&S Blends",       "width_px": 380},
                {"brand": "M&S Cordial",      "width_px": 260},
                {"brand": "Presse",           "width_px": 340},
            ],
        },
        {
            "shelf": "shelf_2", "total_width_px": 1480,
            "brands": [
                {"brand": "M&S Lemonade",       "width_px": 360},
                {"brand": "San Pellegrino",     "width_px": 420},
                {"brand": "M&S British Apple",  "width_px": 180},
                {"brand": "M&S Juice",          "width_px": 520},
            ],
        },
        {
            "shelf": "shelf_3", "total_width_px": 1480,
            "brands": [
                {"brand": "M&S Lemonade",     "width_px": 300},
                {"brand": "Jooj",             "width_px": 420},
                {"brand": "Presse",           "width_px": 380},
                {"brand": "M&S Sparkling",    "width_px": 380},
            ],
        },
        {
            "shelf": "shelf_4", "total_width_px": 1480,
            "brands": [
                {"brand": "Coca-Cola",        "width_px": 340},
                {"brand": "Fanta",            "width_px": 220},
                {"brand": "Coca-Cola Zero",   "width_px": 240},
                {"brand": "M&S Cola",         "width_px": 220},
                {"brand": "M&S Lemon",        "width_px": 460},
            ],
        },
    ]
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze_route():
    if "image" not in request.files:
        return jsonify({"error": "no image uploaded"}), 400
    f = request.files["image"]

    if is_mock():
        import copy, time
        time.sleep(0.6)
        result = copy.deepcopy(MOCK_RESULT)
    else:
        from shelf_share_analyzer import analyze
        suffix = Path(f.filename or "upload.jpg").suffix or ".jpg"
        tmp = Path("/tmp") / f"shelf_upload{suffix}"
        f.save(tmp)
        try:
            result = analyze(get_client(), tmp)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            try: tmp.unlink()
            except OSError: pass

    grand = sum(s["total_width_px"] for s in result["shelves"]) or 1
    agg: dict[str, int] = {}
    for shelf in result["shelves"]:
        total = shelf["total_width_px"] or 1
        for b in shelf["brands"]:
            b["pct"] = round(100 * b["width_px"] / total, 1)
            agg[b["brand"]] = agg.get(b["brand"], 0) + b["width_px"]
    overall = [
        {"brand": b, "width_px": w, "pct": round(100 * w / grand, 1)}
        for b, w in sorted(agg.items(), key=lambda x: -x[1])
    ]
    return jsonify({"shelves": result["shelves"], "overall": overall, "mock": is_mock()})


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--mock", action="store_true", help="serve canned data, no API call")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 5000)))
    args = ap.parse_args()
    if args.mock:
        os.environ["SHELF_MOCK"] = "1"
        print("[mock mode] serving canned shelf data — no Claude API calls", file=sys.stderr)
    app.run(host="0.0.0.0", port=args.port, debug=False)
