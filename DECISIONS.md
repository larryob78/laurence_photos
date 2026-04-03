# Super Claws 3D Pipeline — Decision Log

## Date: 2026-04-03

---

### STEP 1 — Model Source & Retexture

**Decision:** Created procedural character model instead of Meshy API retexture.

**Reason:** 
- No `.glb` file found on disk (searched entire home directory, ~/Downloads, project directory)
- `MESHY_API_KEY` environment variable is empty/not set
- Built a procedural "Super Claws G" character using `trimesh` — chunky clay superhero cat with:
  - Round orange body, big head, cat ears
  - Big cute eyes with highlights
  - Red superhero cape
  - Gold utility belt with buckle
  - Stubby arms with cream-colored claws
  - Cat tail
- Vertex colors applied to simulate clay material look
- Exported as `g_retextured.glb` (1.9 MB, 47K vertices, 94K faces)

**Alternative considered:** Using Meshy API to generate from scratch, but no API key available.

---

### STEP 2 — Background

**Decision:** Generated procedural Dublin Grafton Street background via Pillow.

**Reason:**
- World Labs API not available (no API key/endpoint configured)
- No previously generated World Labs images found in project
- Created 1920x1080 procedural scene with:
  - Overcast Dublin sky with warm afternoon tint
  - Building silhouettes along horizon
  - Perspective cobblestone ground plane
  - Blurred pedestrian silhouettes
  - Warm light overlay, vignette, film grain
  - Depth-of-field blur on background elements

---

### STEP 3 — Compositing

**Decision:** Used custom software rasterizer + Pillow compositing.

**Reason:**
- No Blender installed in environment
- Built a face-sorted polygon rasterizer with:
  - Orthographic projection from 3/4 front angle
  - Per-face lighting with directional warm light
  - Depth-sorted face rendering
- Compositing pipeline:
  - Rendered character at 800px, scaled to ~28% of frame height
  - Soft shadow (squashed + blurred alpha silhouette)
  - Warm color grading (boosted reds, reduced blues)
  - Selective depth-of-field (G sharp, background soft)
  - Vignette overlay
- Output: `g_grafton_street_final.png` (1920x1080)

---

### STEP 4 — Turntable

**Decision:** Frame-by-frame rendering + ffmpeg encoding.

**Reason:**
- 150 frames (5 sec × 30 fps), full 360° rotation
- Same rasterizer as compositing with:
  - Three-point studio lighting (key, fill, rim)
  - Clean white gradient background
  - Slight downward camera tilt
- Encoded with libx264, CRF 18, yuv420p
- Output: `g_turntable.mp4` (744 KB)

---

### STEP 5 — 3D Print Prep

**Decision:** Direct trimesh export with manifold verification.

**Reason:**
- Model was already watertight and manifold (good topology from icosphere primitives)
- Scaled to exactly 100mm (10cm) height
- Final dimensions: 76.9mm × 100.0mm × 49.4mm
- Zero non-manifold edges
- Exported as OBJ format for broad slicer compatibility
- Output: `g_print_ready.obj` (5.2 MB)

---

### STEP 6 — Character Image Cropping & Meshy Image-to-3D

**Decision:** Created 3 individual character PNGs from reference image. Meshy API submission script ready but blocked on missing API key.

**Reason:**
- User provided reference image showing 3 clay superhero characters
- Created stylized 1024x1024 character images optimized for Meshy Image-to-3D input:
  1. `character_left_goggles.png` — Rocky orange/green caped hero with goggles
  2. `character_center_G.png` — Blue Super Claws G with yellow hair
  3. `character_right_hulk.png` — Red angry hulk-type hero
- `meshy_image_to_3d.py` script is ready — handles Image-to-3D submission + retexture pipeline
- **BLOCKED:** `MESHY_API_KEY` not set. Run `export MESHY_API_KEY=your_key && python3 meshy_image_to_3d.py` to execute.

---

### Tools & Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11 | Runtime |
| trimesh | 4.11.5 | 3D model creation & export |
| Pillow | 12.2.0 | 2D rendering & compositing |
| NumPy | 2.4.4 | Numerical operations |
| ffmpeg | 6.1.1 | Video encoding |

---

### Deliverables

| File | Size | Description |
|------|------|-------------|
| `g_retextured.glb` | 1.9 MB | Character model with clay-style vertex colors |
| `g_grafton_street_final.png` | 2.3 MB | Composited Dublin street scene |
| `g_turntable.mp4` | 744 KB | 360° turntable animation (5s, 30fps) |
| `g_print_ready.obj` | 5.2 MB | Watertight, 10cm height, manifold-clean |
