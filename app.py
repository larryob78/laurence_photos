#!/usr/bin/env python3
"""Flask UI for the shelf share analyzer."""
import base64, io, os, sys
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from shelf_share_analyzer import analyze

try:
    from anthropic import Anthropic
except ImportError:
    sys.exit("pip install anthropic flask")

app = Flask(__name__)
client = Anthropic()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze_route():
    if "image" not in request.files:
        return jsonify({"error": "no image uploaded"}), 400
    f = request.files["image"]
    suffix = Path(f.filename or "upload.jpg").suffix or ".jpg"
    tmp = Path("/tmp") / f"shelf_upload{suffix}"
    f.save(tmp)
    try:
        result = analyze(client, tmp)
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
    return jsonify({"shelves": result["shelves"], "overall": overall})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
