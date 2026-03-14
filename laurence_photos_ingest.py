#!/usr/bin/env python3
"""LAURENCE PHOTOS — INGESTION PIPELINE v1.2.0"""
import argparse, hashlib, json, logging, os, re, sqlite3, sys, time
from collections import Counter
from datetime import datetime
from pathlib import Path
VERSION = "1.2.0"
IMAGE_EXTENSIONS = {".png",".jpg",".jpeg",".gif",".bmp",".webp",".tiff",".tif",".heic",".heif",".avif",".svg"}
CATEGORY_SIGNALS = {
    "screenshot": ["screenshot","screen shot","screen_shot","screencap","screenclip","snip","capture","grab","clip","cleanshot","shottr","skitch"],
    "ai_tool": ["midjourney","dalle","dall-e","stable_diffusion","stablediffusion","comfyui","automatic1111","a1111","flux","runway","pika","kling","leonardo","firefly","ideogram","playground","civitai","replicate","fal.ai","fal_ai","txt2img","img2img","controlnet","lora","dreambooth","generated","ai_gen","aigen","ai-gen"],
    "note": ["note","memo","draft","writing","text","journal","log","todo","checklist","list","obsidian","notion","roam","apple_notes"],
    "diagram": ["diagram","flowchart","mindmap","mind_map","whiteboard","miro","figma","figjam","excalidraw","lucidchart","draw.io","drawio","wireframe","mockup","schema","architecture","uml","erd","sequence_diagram","graph","chart","infographic","sketch","blueprint"],
    "ui_design": ["figma","sketch_app","ui","ux","prototype","component","design_system","storybook","zeplin","invision"],
    "code": ["code","terminal","console","vscode","vim","sublime","cursor","ide","debug","error","stacktrace","syntax","github","gitlab"],
    "reference": ["reference","inspiration","moodboard","mood_board","palette","color","typography","texture","bookmark","saved","clipping"],
}
PERSONAL_FOLDER_SIGNALS = ["my photos","camera roll","dcim","photo library","iphotos","iphoto","photo booth","photo stream","moments","memories","albums"]
WORK_FOLDER_SIGNALS = ["screenshots","screenshot","screen shot","downloads","documents","desktop","notes","drawings","sketches","designs","projects","work","client","clients","creative","assets","exports","renders","output","figma","miro","notion","obsidian","reference","inspiration","research","presentations","decks","proposals","storyboard","moodboard","boards"]
PERSONAL_NAME_SIGNALS = ["img_","dsc_","dscf","dscn","photo_","pic_"]
STRONG_PERSONAL_SIGNALS = ["selfie","camera_roll","dcim","photo_booth"]
KNOWN_SCREEN_SIZES = {(2880,1800),(3024,1964),(3456,2234),(2560,1600),(5120,2880),(6016,3384),(4480,2520),(1440,900),(1680,1050),(1920,1200),(2560,1440),(1920,1080),(2560,1080),(3440,1440),(3840,2160),(1366,768),(1536,864),(1600,900),(1280,720),(1280,800),(1024,768),(3840,1080),(5120,1440),(2048,2732),(2732,2048),(2388,1668),(1668,2388),(2360,1640),(1640,2360),(2048,1536),(1536,2048),(1290,2796),(2796,1290),(1179,2556),(2556,1179),(1170,2532),(2532,1170),(1284,2778),(2778,1284),(1125,2436),(2436,1125),(1242,2688),(2688,1242),(750,1334),(1334,750),(1080,1920),(828,1792),(1792,828),(1242,2208),(2208,1242),(1080,2340),(2340,1080),(1440,3200),(3200,1440),(1080,2400),(2400,1080),(1320,2868),(2868,1320),(1206,2622),(2622,1206)}
KNOWN_SCREEN_WIDTHS = {2880,3024,3456,2560,5120,6016,4480,1440,1680,1920,3440,3840,1366,1536,1600,1280,1024,1290,1179,1170,1284,1125,1242,750,828,1320,1206}
logger = logging.getLogger("laurence_photos")
def setup_logging(verbose=False):
    level = logging.DEBUG if verbose else logging.INFO
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s", datefmt="%H:%M:%S"))
    logger.setLevel(level)
    logger.addHandler(handler)
def _is_screenshot(filepath, img_meta=None):
    name_lower = filepath.stem.lower()
    path_lower = str(filepath).lower()
    if re.match(r"^screenshot[\s_-]", name_lower): return True, "screenshot_name"
    if re.match(r"^screen\s?shot[\s_-]", name_lower): return True, "screenshot_name"
    if re.match(r"^cleanshot[\s_-]", name_lower): return True, "screenshot_name"
    if "/screenshots/" in path_lower: return True, "screenshots_folder"
    if img_meta:
        w, h = img_meta.get("width"), img_meta.get("height")
        if w and h:
            if (w, h) in KNOWN_SCREEN_SIZES: return True, f"screen_res:{w}x{h}"
            if w in KNOWN_SCREEN_WIDTHS and filepath.suffix.lower() == ".png": return True, f"screen_width_png:{w}"
        if img_meta.get("apple_device") and filepath.suffix.lower() == ".png" and not img_meta.get("has_gps"):
            if w and h and (w, h) in KNOWN_SCREEN_SIZES: return True, f"iphone_screenshot:{w}x{h}"
    return False, ""
def _is_in_personal_folder(filepath):
    path_lower = str(filepath).lower().replace("\\", "/")
    for signal in PERSONAL_FOLDER_SIGNALS:
        if signal in path_lower: return True, signal
    return False, ""
def _is_in_work_folder(filepath):
    path_lower = str(filepath).lower().replace("\\", "/")
    for signal in WORK_FOLDER_SIGNALS:
        if f"/{signal}/" in path_lower or path_lower.endswith(f"/{signal}"): return True, signal
    return False, ""
class PrivacyFilter:
    def __init__(self):
        self.face_detector = None
        self._try_load_opencv()
        self._pil_available = False
        try:
            from PIL import Image
            self._pil_available = True
        except ImportError: pass
    def _try_load_opencv(self):
        try:
            import cv2
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.face_detector = cv2.CascadeClassifier(cascade_path)
            if self.face_detector.empty():
                self.face_detector = None
                logger.warning("OpenCV face cascade failed to load")
            else: logger.info("OpenCV face detection enabled")
        except ImportError:
            logger.info("OpenCV not installed - heuristic privacy filter only")
    def check(self, filepath, img_meta=None):
        path_lower = str(filepath).lower().replace("\\", "/")
        name_lower = filepath.stem.lower()
        is_ss, ss_reason = _is_screenshot(filepath, img_meta)
        if is_ss: return False, f"screenshot_override:{ss_reason}"
        in_work, work_signal = _is_in_work_folder(filepath)
        in_personal, personal_folder = _is_in_personal_folder(filepath)
        for signal in STRONG_PERSONAL_SIGNALS:
            if signal in path_lower or signal in name_lower: return True, f"strong_personal:{signal}"
        if in_personal:
            for signal in PERSONAL_NAME_SIGNALS:
                if signal in name_lower: return True, f"personal_folder_photo:{personal_folder}+{signal}"
            if re.match(r"^(img|dsc|dscf|dscn|p|sam)[\s_-]?\d{4,}", name_lower): return True, f"camera_pattern_in:{personal_folder}"
        has_gps, is_phone_camera, phone_info = False, False, ""
        if self._pil_available:
            try:
                from PIL import Image
                from PIL.ExifTags import TAGS
                img = Image.open(filepath)
                exif_data = img.getexif()
                if exif_data:
                    for tag_id, value in exif_data.items():
                        tag_name = TAGS.get(tag_id, str(tag_id))
                        if "gps" in tag_name.lower(): has_gps = True; break
                    make = exif_data.get(271, "").lower()
                    model = exif_data.get(272, "").lower()
                    for brand in ["apple","samsung","google","huawei","xiaomi","oppo","vivo","oneplus"]:
                        if brand in make or brand in model: is_phone_camera = True; phone_info = f"{make}_{model}".strip("_"); break
                img.close()
            except Exception as e: logger.debug(f"PIL check failed for {filepath}: {e}")
        if has_gps and in_personal: return True, f"gps_in_personal:{personal_folder}"
        if has_gps and is_phone_camera: return True, f"gps_phone:{phone_info}"
        if is_phone_camera and in_personal: return True, f"phone_in_personal:{phone_info}+{personal_folder}"
        if in_work: return False, f"work_folder:{work_signal}"
        if self.face_detector is not None:
            try:
                import cv2
                img_cv = cv2.imread(str(filepath))
                if img_cv is not None:
                    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                    max_dim = 800
                    h, w = gray.shape[:2]
                    if max(h, w) > max_dim:
                        scale = max_dim / max(h, w)
                        gray = cv2.resize(gray, None, fx=scale, fy=scale)
                    faces = self.face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                    if len(faces) > 0: return True, f"faces_detected:{len(faces)}"
            except Exception as e: logger.debug(f"OpenCV check failed for {filepath}: {e}")
        return False, ""
def classify_image(filepath, img_meta=None):
    path_lower = str(filepath).lower().replace("\\", "/")
    name_lower = filepath.stem.lower()
    search_text = f"{path_lower} {name_lower}"
    scores, matched_signals = {}, {}
    for category, signals in CATEGORY_SIGNALS.items():
        score, matches = 0, []
        for signal in signals:
            if signal in search_text: score += 1; matches.append(signal)
        if score > 0: scores[category] = score; matched_signals[category] = matches
    if re.match(r"^screenshot[\s_-]+\d{4}[\s_-]\d{2}[\s_-]\d{2}", name_lower):
        scores["screenshot"] = scores.get("screenshot", 0) + 3
        matched_signals.setdefault("screenshot", []).append("macos_naming")
    elif re.match(r"^screen\s?shot[\s_-]", name_lower):
        scores["screenshot"] = scores.get("screenshot", 0) + 3
        matched_signals.setdefault("screenshot", []).append("screenshot_naming")
    elif re.match(r"^cleanshot[\s_-]", name_lower):
        scores["screenshot"] = scores.get("screenshot", 0) + 3
        matched_signals.setdefault("screenshot", []).append("cleanshot_naming")
    w = img_meta.get("width") if img_meta else None
    h = img_meta.get("height") if img_meta else None
    ext = filepath.suffix.lower()
    if w and h:
        if (w, h) in KNOWN_SCREEN_SIZES:
            scores["screenshot"] = scores.get("screenshot", 0) + 2
            matched_signals.setdefault("screenshot", []).append(f"screen_res:{w}x{h}")
        elif w in KNOWN_SCREEN_WIDTHS and ext == ".png":
            scores["screenshot"] = scores.get("screenshot", 0) + 1
            matched_signals.setdefault("screenshot", []).append(f"screen_width:{w}")
    if ext == ".png" and img_meta:
        if not img_meta.get("has_exif", False) and img_meta.get("format") == "PNG" and img_meta.get("mode") in ("RGB", "RGBA", "P"):
            scores["screenshot"] = scores.get("screenshot", 0) + 1
            matched_signals.setdefault("screenshot", []).append("png_no_exif")
    if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-", name_lower):
        scores["reference"] = scores.get("reference", 0) + 1
        matched_signals.setdefault("reference", []).append("uuid_filename")
    elif re.match(r"^[0-9a-f]{24,}", name_lower):
        scores["reference"] = scores.get("reference", 0) + 1
        matched_signals.setdefault("reference", []).append("hash_filename")
    primary = max(scores, key=scores.get) if scores else "uncategorized"
    categories = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
    return {"primary_category": primary, "all_categories": categories, "signals": matched_signals, "confidence": min(scores.get(primary, 0) / 3.0, 1.0) if scores else 0.0}
def get_image_metadata(filepath):
    stat = filepath.stat()
    meta = {"size_bytes": stat.st_size, "size_human": _human_size(stat.st_size), "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(), "created": datetime.fromtimestamp(stat.st_ctime).isoformat(), "extension": filepath.suffix.lower(), "has_exif": False, "has_gps": False, "apple_device": False}
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS
        img = Image.open(filepath)
        meta["width"], meta["height"] = img.size
        meta["format"], meta["mode"] = img.format, img.mode
        exif = img.getexif()
        meta["has_exif"] = bool(exif) and len(exif) > 0
        if exif:
            for tag_id, value in exif.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                if "gps" in tag_name.lower(): meta["has_gps"] = True; break
            make = exif.get(271, "").lower()
            model = exif.get(272, "").lower()
            if "apple" in make or "iphone" in model or "ipad" in model:
                meta["apple_device"] = True
        img.close()
    except Exception: pass
    meta["sha256"] = _file_hash(filepath)
    return meta
def _file_hash(filepath, chunk_size=8192):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk: break
            h.update(chunk)
    return h.hexdigest()
def _human_size(size_bytes):
    for unit in ["B", "KB", "MB", "GB"]:
        if abs(size_bytes) < 1024: return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"
SCHEMA = """
CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, filepath TEXT UNIQUE NOT NULL, filename TEXT NOT NULL, sha256 TEXT NOT NULL, size_bytes INTEGER, width INTEGER, height INTEGER, format TEXT, mode TEXT, extension TEXT, modified_at TEXT, created_at TEXT, primary_category TEXT, all_categories TEXT, signals TEXT, confidence REAL, ingested_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rejected (id INTEGER PRIMARY KEY AUTOINCREMENT, filepath TEXT UNIQUE NOT NULL, filename TEXT NOT NULL, reject_reason TEXT NOT NULL, rejected_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ingest_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, source_dir TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, total_scanned INTEGER DEFAULT 0, total_accepted INTEGER DEFAULT 0, total_rejected INTEGER DEFAULT 0, total_skipped INTEGER DEFAULT 0, total_errors INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(primary_category);
CREATE INDEX IF NOT EXISTS idx_images_sha256 ON images(sha256);
CREATE INDEX IF NOT EXISTS idx_rejected_reason ON rejected(reject_reason);
"""
class Database:
    def __init__(self, db_path):
        self.db_path = db_path; self.conn = sqlite3.connect(str(db_path)); self.conn.execute("PRAGMA journal_mode=WAL"); self.conn.executescript(SCHEMA); self.conn.commit()
    def image_exists(self, sha256): return self.conn.execute("SELECT 1 FROM images WHERE sha256 = ? LIMIT 1", (sha256,)).fetchone() is not None
    def insert_image(self, r):
        self.conn.execute("INSERT OR REPLACE INTO images (filepath, filename, sha256, size_bytes, width, height, format, mode, extension, modified_at, created_at, primary_category, all_categories, signals, confidence, ingested_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (r["filepath"], r["filename"], r["sha256"], r.get("size_bytes"), r.get("width"), r.get("height"), r.get("format"), r.get("mode"), r.get("extension"), r.get("modified_at"), r.get("created_at"), r["primary_category"], json.dumps(r.get("all_categories", [])), json.dumps(r.get("signals", {})), r.get("confidence", 0), r["ingested_at"]))
    def insert_rejected(self, filepath, filename, reason):
        self.conn.execute("INSERT OR REPLACE INTO rejected (filepath, filename, reject_reason, rejected_at) VALUES (?,?,?,?)", (filepath, filename, reason, datetime.now().isoformat()))
    def start_run(self, source_dir):
        cur = self.conn.execute("INSERT INTO ingest_runs (source_dir, started_at) VALUES (?,?)", (source_dir, datetime.now().isoformat())); self.conn.commit(); return cur.lastrowid
    def finish_run(self, run_id, stats):
        self.conn.execute("UPDATE ingest_runs SET finished_at=?, total_scanned=?, total_accepted=?, total_rejected=?, total_skipped=?, total_errors=? WHERE id=?",
            (datetime.now().isoformat(), stats["scanned"], stats["accepted"], stats["rejected"], stats["skipped"], stats["errors"], run_id)); self.conn.commit()
    def commit(self): self.conn.commit()
    def close(self): self.conn.commit(); self.conn.close()
class JSONLWriter:
    def __init__(self, path): self.path = path; self.file = open(path, "a", encoding="utf-8")
    def write(self, record): self.file.write(json.dumps(record, ensure_ascii=False) + "\n")
    def close(self): self.file.close()
def scan_images(source_dir):
    images = []
    for ext in IMAGE_EXTENSIONS: images.extend(source_dir.rglob(f"*{ext}")); images.extend(source_dir.rglob(f"*{ext.upper()}"))
    seen, unique = set(), []
    for p in images:
        resolved = p.resolve()
        if resolved not in seen: seen.add(resolved); unique.append(p)
    return sorted(unique)
def run_pipeline(source_dir, output_dir, dry_run=False, verbose=False):
    setup_logging(verbose)
    logger.info("=" * 60); logger.info("  LAURENCE PHOTOS - INGESTION PIPELINE v%s", VERSION); logger.info("=" * 60)
    logger.info("Source:  %s", source_dir); logger.info("Output:  %s", output_dir); logger.info("Dry run: %s", dry_run); logger.info("")
    if not source_dir.exists(): logger.error("Source directory does not exist: %s", source_dir); sys.exit(1)
    output_dir.mkdir(parents=True, exist_ok=True)
    db_path = output_dir / "laurence_photos.db"; jsonl_path = output_dir / "laurence_photos.jsonl"
    privacy = PrivacyFilter()
    db = Database(db_path) if not dry_run else None; jsonl = JSONLWriter(jsonl_path) if not dry_run else None
    run_id = db.start_run(str(source_dir)) if db else None
    logger.info("Scanning for images..."); all_images = scan_images(source_dir); logger.info("Found %d image files", len(all_images)); logger.info("")
    stats = Counter(scanned=0, accepted=0, rejected=0, skipped=0, errors=0)
    category_counts, reject_reasons = Counter(), Counter()
    t_start = time.time()
    for i, filepath in enumerate(all_images, 1):
        stats["scanned"] += 1; rel_path = filepath.relative_to(source_dir)
        try:
            meta = get_image_metadata(filepath)
            rejected, reason = privacy.check(filepath, img_meta=meta)
            if rejected:
                stats["rejected"] += 1; reject_reasons[reason.split(":")[0]] += 1
                if db: db.insert_rejected(str(rel_path), filepath.name, reason)
                if verbose: logger.debug("REJECT  %s  (%s)", rel_path, reason)
                continue
            if db and db.image_exists(meta["sha256"]):
                stats["skipped"] += 1
                if verbose: logger.debug("SKIP    %s  (duplicate)", rel_path)
                continue
            classification = classify_image(filepath, img_meta=meta)
            record = {"filepath": str(rel_path), "filename": filepath.name, "sha256": meta["sha256"], "size_bytes": meta["size_bytes"], "size_human": meta["size_human"], "width": meta.get("width"), "height": meta.get("height"), "format": meta.get("format"), "mode": meta.get("mode"), "extension": meta["extension"], "modified_at": meta["modified"], "created_at": meta["created"], "primary_category": classification["primary_category"], "all_categories": classification["all_categories"], "signals": classification["signals"], "confidence": classification["confidence"], "ingested_at": datetime.now().isoformat()}
            stats["accepted"] += 1; category_counts[classification["primary_category"]] += 1
            if db: db.insert_image(record)
            if jsonl: jsonl.write(record)
            if verbose: logger.debug("ACCEPT  %-40s  [%s] (%.0f%%)", str(rel_path)[:40], classification["primary_category"], classification["confidence"] * 100)
            if db and i % 100 == 0: db.commit()
        except Exception as e: stats["errors"] += 1; logger.warning("ERROR   %s: %s", rel_path, e)
        if i % 50 == 0 or i == len(all_images):
            pct = (i / len(all_images)) * 100
            logger.info("  Progress: %d/%d (%.0f%%) - %d accepted, %d rejected", i, len(all_images), pct, stats["accepted"], stats["rejected"])
    elapsed = time.time() - t_start
    if db: db.finish_run(run_id, stats); db.close()
    if jsonl: jsonl.close()
    logger.info(""); logger.info("=" * 60); logger.info("  INGESTION COMPLETE"); logger.info("=" * 60)
    logger.info("  Scanned:  %6d files", stats["scanned"]); logger.info("  Accepted: %6d  (kept)", stats["accepted"]); logger.info("  Rejected: %6d  (privacy filter)", stats["rejected"]); logger.info("  Skipped:  %6d  (duplicates)", stats["skipped"]); logger.info("  Errors:   %6d", stats["errors"]); logger.info("  Time:     %6.1fs", elapsed); logger.info("")
    if category_counts:
        logger.info("  Categories:")
        for cat, count in category_counts.most_common(): logger.info("    %-18s %4d", cat, count)
    if reject_reasons:
        logger.info("  Rejection reasons:")
        for reason, count in reject_reasons.most_common(): logger.info("    %-25s %4d", reason, count)
    if not dry_run: logger.info("  Outputs:"); logger.info("    SQLite: %s", db_path); logger.info("    JSONL:  %s", jsonl_path)
    else: logger.info("  (Dry run - no files written)")
    logger.info(""); return dict(stats)
def install_cron(source, output=None, verbose=False):
    """Install a crontab entry to run ingestion every Friday at 23:00."""
    import shutil, subprocess
    script_path = Path(__file__).resolve()
    python_path = shutil.which("python3") or sys.executable
    output_dir = output or Path("./laurence_photos_output")
    cmd = f'{python_path} {script_path} "{source}" -o "{output_dir}"'
    if verbose:
        cmd += " -v"
    cron_line = f'0 23 * * 5 {cmd} >> "{output_dir}/cron.log" 2>&1'
    result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
    existing = result.stdout if result.returncode == 0 else ""
    marker = "# laurence_photos weekly ingest"
    clean_lines = [line for line in existing.splitlines() if marker not in line and "laurence_photos_ingest" not in line]
    clean_lines.append(f"{cron_line}  {marker}")
    new_crontab = "\n".join(clean_lines) + "\n"
    proc = subprocess.run(["crontab", "-"], input=new_crontab, capture_output=True, text=True)
    if proc.returncode == 0:
        logger.info("Cron job installed: every Friday at 23:00")
        logger.info("  %s", cron_line)
    else:
        logger.error("Failed to install cron job: %s", proc.stderr)
    return proc.returncode == 0

def main():
    parser = argparse.ArgumentParser(description="Laurence Photos - Ingestion Pipeline v1.2", formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path, help="Directory to scan (recursive)")
    parser.add_argument("--output", "-o", type=Path, default=None, help="Output directory for SQLite + JSONL")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Scan and classify without writing output")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show per-file decisions")
    parser.add_argument("--version", action="version", version=f"%(prog)s {VERSION}")
    parser.add_argument("--install-cron", action="store_true", help="Install weekly cron job (Friday 23:00) and exit")
    args = parser.parse_args()
    output = args.output or Path("./laurence_photos_output")
    if args.install_cron:
        setup_logging(args.verbose)
        install_cron(source=args.source.expanduser().resolve(), output=output.expanduser().resolve(), verbose=args.verbose)
        return
    run_pipeline(source_dir=args.source.expanduser().resolve(), output_dir=output.expanduser().resolve(), dry_run=args.dry_run, verbose=args.verbose)
if __name__ == "__main__":
    main()
