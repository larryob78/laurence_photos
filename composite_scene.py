#!/usr/bin/env python3
"""
Composite Super Claws G into the Dublin Grafton Street scene.
- Render G from a front 3/4 angle using trimesh
- Place on cobblestone background
- Add soft shadow, DoF, warm lighting
- Scale G to look ~2 inches on real cobblestones
"""
import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import os

os.chdir("/home/user/laurence_photos")

RENDER_SIZE = 800  # Size for character render

def render_model_to_image(mesh, size=RENDER_SIZE, angle_y=0.4, angle_x=-0.2):
    """
    Render a trimesh model to an RGBA image using orthographic projection.
    Simple vertex-color based rendering with depth sorting.
    """
    from copy import deepcopy
    m = deepcopy(mesh)

    # Apply rotation for 3/4 front view
    rot_y = trimesh.transformations.rotation_matrix(angle_y, [0, 1, 0])
    rot_x = trimesh.transformations.rotation_matrix(angle_x, [1, 0, 0])
    m.apply_transform(rot_y)
    m.apply_transform(rot_x)

    # Get bounding box and normalize
    bounds = m.bounds
    center = (bounds[0] + bounds[1]) / 2
    scale = 0.85 * size / max(bounds[1] - bounds[0])

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    verts = m.vertices
    faces = m.faces

    # Get face colors from vertex colors
    if hasattr(m.visual, 'vertex_colors') and m.visual.vertex_colors is not None:
        vert_colors = m.visual.vertex_colors
    else:
        vert_colors = np.full((len(verts), 4), [200, 160, 100, 255], dtype=np.uint8)

    # Calculate face centroids for depth sorting
    face_centers = verts[faces].mean(axis=1)
    face_depths = face_centers[:, 2]

    # Sort faces back to front
    sorted_indices = np.argsort(face_depths)

    # Simple face normal lighting
    v0 = verts[faces[:, 0]]
    v1 = verts[faces[:, 1]]
    v2 = verts[faces[:, 2]]
    normals = np.cross(v1 - v0, v2 - v0)
    norms = np.linalg.norm(normals, axis=1, keepdims=True)
    norms[norms == 0] = 1
    normals = normals / norms

    # Light direction (warm from upper-left-front)
    light_dir = np.array([0.3, 0.6, 0.7])
    light_dir = light_dir / np.linalg.norm(light_dir)
    lighting = np.clip(np.dot(normals, light_dir), 0.2, 1.0)

    for idx in sorted_indices:
        face = faces[idx]
        pts = []
        for vi in face:
            x = (verts[vi][0] - center[0]) * scale + size / 2
            y = -(verts[vi][1] - center[1]) * scale + size / 2
            pts.append((int(x), int(y)))

        # Average vertex color for face
        fc = vert_colors[face].mean(axis=0).astype(int)
        lit = lighting[idx]

        # Apply lighting with warm tint
        r = min(255, int(fc[0] * lit * 1.05))
        g = min(255, int(fc[1] * lit * 1.0))
        b = min(255, int(fc[2] * lit * 0.9))

        if len(pts) >= 3:
            draw.polygon(pts, fill=(r, g, b, 255))

    return img


def create_shadow(char_img, offset_y=20, blur=15, opacity=100):
    """Create a soft shadow beneath the character."""
    # Create shadow from alpha channel
    alpha = char_img.split()[3]

    shadow = Image.new("RGBA", char_img.size, (0, 0, 0, 0))
    shadow_layer = Image.new("L", char_img.size, 0)

    # Flatten shadow vertically (squash)
    w, h = alpha.size
    squashed = alpha.resize((w, h // 4), Image.LANCZOS)
    squashed = squashed.resize((w, h), Image.LANCZOS)

    # Position at bottom
    shadow_alpha = Image.new("L", char_img.size, 0)
    shadow_alpha.paste(squashed, (0, offset_y))
    shadow_alpha = shadow_alpha.filter(ImageFilter.GaussianBlur(radius=blur))

    # Reduce opacity
    shadow_alpha = shadow_alpha.point(lambda x: min(x, opacity))

    shadow = Image.new("RGBA", char_img.size, (20, 15, 10, 0))
    shadow.putalpha(shadow_alpha)
    return shadow


print("Loading model...")
model = trimesh.load("g_retextured.glb")
if isinstance(model, trimesh.Scene):
    model = trimesh.util.concatenate(list(model.geometry.values()))

print("Rendering character from 3/4 angle...")
char_img = render_model_to_image(model, size=RENDER_SIZE, angle_y=0.45, angle_x=-0.15)

# Trim to content
bbox = char_img.getbbox()
if bbox:
    char_img = char_img.crop(bbox)

print(f"Character rendered: {char_img.size}")

# Load background
print("Loading background...")
bg = Image.open("dublin_grafton_street_bg.png").convert("RGBA")
bg_w, bg_h = bg.size

# Scale G to look ~2 inches on cobblestones (small on the street)
# At ground level, G should be about 1/6 of the frame height
target_h = int(bg_h * 0.28)
aspect = char_img.width / char_img.height
target_w = int(target_h * aspect)
char_img = char_img.resize((target_w, target_h), Image.LANCZOS)

# Position G on the cobblestones (lower center-right)
paste_x = bg_w // 2 - target_w // 2 + 50
paste_y = bg_h - target_h - int(bg_h * 0.08)

# Create shadow
print("Adding shadow...")
shadow = create_shadow(char_img, offset_y=10, blur=20, opacity=80)

# Composite: background -> shadow -> character
canvas = bg.copy()

# Place shadow slightly below and offset
shadow_x = paste_x - 10
shadow_y = paste_y + target_h // 3
canvas.paste(shadow, (shadow_x, shadow_y), shadow)

# Place character
canvas.paste(char_img, (paste_x, paste_y), char_img)

# === WARM LIGHTING GRADE ===
print("Applying warm Dublin lighting...")
canvas_rgb = canvas.convert("RGB")
arr = np.array(canvas_rgb).astype(np.float32)

# Warm color grade
arr[:, :, 0] *= 1.05  # Slightly boost reds
arr[:, :, 1] *= 1.02  # Slight green boost
arr[:, :, 2] *= 0.92  # Reduce blues for warmth
arr = np.clip(arr, 0, 255).astype(np.uint8)
canvas = Image.fromarray(arr)

# Slight contrast boost
enhancer = ImageEnhance.Contrast(canvas)
canvas = enhancer.enhance(1.08)

# === DEPTH OF FIELD on background (keep G sharp) ===
print("Applying depth of field...")
# Create a mask where G's area is sharp
dof_mask = Image.new("L", canvas.size, 200)  # Default: blurry
dof_draw = ImageDraw.Draw(dof_mask)
# Sharp area around G with feathered edges
margin = 40
dof_draw.rectangle(
    [paste_x - margin, paste_y - margin,
     paste_x + target_w + margin, paste_y + target_h + margin],
    fill=0
)
dof_mask = dof_mask.filter(ImageFilter.GaussianBlur(radius=30))

blurred_canvas = canvas.filter(ImageFilter.GaussianBlur(radius=4))
canvas = Image.composite(blurred_canvas, canvas, dof_mask)

# === VIGNETTE ===
vig = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
vig_draw = ImageDraw.Draw(vig)
for i in range(40):
    alpha = i
    m = i * 20
    if m < bg_w // 2 and m < bg_h // 2:
        vig_draw.rectangle([m, m, bg_w - m, bg_h - m], outline=(0, 0, 0, alpha))
vig = vig.filter(ImageFilter.GaussianBlur(radius=25))
canvas = Image.alpha_composite(canvas.convert("RGBA"), vig).convert("RGB")

canvas.save("g_grafton_street_final.png", quality=95)
print(f"Saved g_grafton_street_final.png ({os.path.getsize('g_grafton_street_final.png')} bytes)")
