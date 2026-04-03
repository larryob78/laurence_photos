#!/usr/bin/env python3
"""
Render a 360° turntable of g_retextured.glb.
5 seconds, 30fps = 150 frames.
Clean white background, warm soft studio lighting.
Export as g_turntable.mp4 via frame sequence + ffmpeg.
"""
import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFilter
from copy import deepcopy
import os
import subprocess
import shutil

os.chdir("/home/user/laurence_photos")

FRAMES = 150  # 5 sec * 30 fps
SIZE = 720
FPS = 30
FRAME_DIR = "/tmp/turntable_frames"

# Clean up frame dir
if os.path.exists(FRAME_DIR):
    shutil.rmtree(FRAME_DIR)
os.makedirs(FRAME_DIR)


def render_frame(mesh, angle_y, size=SIZE):
    """Render one frame of the turntable."""
    m = deepcopy(mesh)

    # Apply rotation
    rot_y = trimesh.transformations.rotation_matrix(angle_y, [0, 1, 0])
    rot_x = trimesh.transformations.rotation_matrix(-0.15, [1, 0, 0])  # Slight tilt
    m.apply_transform(rot_y)
    m.apply_transform(rot_x)

    bounds = m.bounds
    center = (bounds[0] + bounds[1]) / 2
    extent = max(bounds[1] - bounds[0])
    scale = 0.75 * size / extent

    # White background with subtle gradient
    img = Image.new("RGB", (size, size), (245, 245, 245))
    draw = ImageDraw.Draw(img)

    # Subtle radial gradient background
    for y in range(size):
        for x in range(0, size, size):  # Just set row color
            dist = ((x - size / 2) ** 2 + (y - size / 2) ** 2) ** 0.5
            t = min(1, dist / (size * 0.7))
            gray = int(250 - t * 20)
            draw.line([(0, y), (size, y)], fill=(gray, gray, gray))

    verts = m.vertices
    faces = m.faces

    if hasattr(m.visual, 'vertex_colors') and m.visual.vertex_colors is not None:
        vert_colors = m.visual.vertex_colors
    else:
        vert_colors = np.full((len(verts), 4), [200, 160, 100, 255], dtype=np.uint8)

    # Depth sort
    face_centers = verts[faces].mean(axis=1)
    sorted_indices = np.argsort(face_centers[:, 2])

    # Lighting
    v0 = verts[faces[:, 0]]
    v1 = verts[faces[:, 1]]
    v2 = verts[faces[:, 2]]
    normals = np.cross(v1 - v0, v2 - v0)
    norms = np.linalg.norm(normals, axis=1, keepdims=True)
    norms[norms == 0] = 1
    normals = normals / norms

    # Warm studio three-point lighting
    key_light = np.array([0.4, 0.5, 0.7])
    key_light /= np.linalg.norm(key_light)
    fill_light = np.array([-0.3, 0.3, 0.5])
    fill_light /= np.linalg.norm(fill_light)
    rim_light = np.array([0.0, 0.2, -0.8])
    rim_light /= np.linalg.norm(rim_light)

    key_intensity = np.clip(np.dot(normals, key_light), 0, 1) * 0.6
    fill_intensity = np.clip(np.dot(normals, fill_light), 0, 1) * 0.25
    rim_intensity = np.clip(np.dot(normals, rim_light), 0, 1) * 0.15
    lighting = np.clip(key_intensity + fill_intensity + rim_intensity + 0.2, 0.25, 1.0)

    for idx in sorted_indices:
        face = faces[idx]
        pts = []
        for vi in face:
            x = (verts[vi][0] - center[0]) * scale + size / 2
            y = -(verts[vi][1] - center[1]) * scale + size / 2
            pts.append((int(x), int(y)))

        fc = vert_colors[face].mean(axis=0).astype(int)
        lit = lighting[idx]

        # Warm studio tint
        r = min(255, int(fc[0] * lit * 1.05))
        g = min(255, int(fc[1] * lit * 1.02))
        b = min(255, int(fc[2] * lit * 0.95))

        if len(pts) >= 3:
            draw.polygon(pts, fill=(r, g, b))

    return img


print("Loading model...")
model = trimesh.load("g_retextured.glb")
if isinstance(model, trimesh.Scene):
    model = trimesh.util.concatenate(list(model.geometry.values()))

# Center the model
model.apply_translation(-model.centroid)

print(f"Rendering {FRAMES} frames for turntable...")
for i in range(FRAMES):
    angle = 2 * np.pi * i / FRAMES
    frame = render_frame(model, angle)
    frame.save(os.path.join(FRAME_DIR, f"frame_{i:04d}.png"))
    if (i + 1) % 30 == 0:
        print(f"  Frame {i + 1}/{FRAMES}")

print("Encoding to MP4 with ffmpeg...")
cmd = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(FRAME_DIR, "frame_%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "medium",
    "-vf", "scale=720:720",
    "g_turntable.mp4"
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"ffmpeg error: {result.stderr[-500:]}")
else:
    print(f"Saved g_turntable.mp4 ({os.path.getsize('g_turntable.mp4')} bytes)")

# Cleanup
shutil.rmtree(FRAME_DIR)
print("Turntable render complete.")
