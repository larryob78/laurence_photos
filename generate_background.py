#!/usr/bin/env python3
"""
Generate a procedural Dublin Grafton Street cobblestone background.
Since World Labs API is not available, create a stylized procedural background
that matches the prompt: cobblestones, overcast sky, warm afternoon light,
ground-level miniature perspective.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import random
import os

os.chdir("/home/user/laurence_photos")

WIDTH, HEIGHT = 1920, 1080
random.seed(42)
np.random.seed(42)

img = Image.new("RGB", (WIDTH, HEIGHT))
draw = ImageDraw.Draw(img)

# === SKY (overcast Dublin sky - upper portion) ===
horizon_y = HEIGHT * 0.35  # Low horizon for ground-level angle

for y in range(int(horizon_y)):
    t = y / horizon_y
    # Overcast grey-blue sky with warm tint
    r = int(165 + t * 30)
    g = int(170 + t * 20)
    b = int(185 + t * 10)
    draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

# === BUILDINGS (distant, blurry shapes along the horizon) ===
building_colors = [
    (120, 105, 95), (135, 120, 108), (110, 100, 90),
    (140, 128, 115), (125, 112, 102), (145, 135, 120)
]

for i in range(30):
    bx = random.randint(-50, WIDTH)
    bw = random.randint(40, 120)
    bh = random.randint(60, 200)
    by = int(horizon_y) - bh
    color = random.choice(building_colors)
    # Add slight variation
    color = tuple(c + random.randint(-10, 10) for c in color)
    draw.rectangle([bx, by, bx + bw, int(horizon_y)], fill=color)

    # Windows (tiny dots)
    for wy in range(by + 10, int(horizon_y) - 5, 15):
        for wx in range(bx + 8, bx + bw - 5, 12):
            if random.random() > 0.3:
                wc = random.randint(160, 220)
                draw.rectangle([wx, wy, wx + 5, wy + 8],
                               fill=(wc, wc - 10, wc - 20))

# === COBBLESTONES (detailed ground plane with perspective) ===
for y in range(int(horizon_y), HEIGHT):
    depth = (y - horizon_y) / (HEIGHT - horizon_y)  # 0 at horizon, 1 at bottom

    for x in range(0, WIDTH, max(3, int(8 + depth * 18))):
        stone_w = max(4, int(10 + depth * 25))
        stone_h = max(3, int(5 + depth * 15))

        # Perspective: stones get larger toward camera
        # Cobblestone colors - warm grey with variation
        base_r = int(140 + depth * 30 + random.randint(-20, 20))
        base_g = int(130 + depth * 25 + random.randint(-20, 20))
        base_b = int(115 + depth * 20 + random.randint(-15, 15))

        # Add some wet/dark stones randomly
        if random.random() < 0.15:
            base_r -= 30
            base_g -= 25
            base_b -= 20

        # Warm afternoon light adds golden tint
        base_r = min(255, base_r + int(depth * 15))
        base_g = min(255, base_g + int(depth * 8))

        ox = random.randint(-2, 2)
        oy = random.randint(-1, 1)

        draw.rounded_rectangle(
            [x + ox, y + oy, x + stone_w + ox - 2, y + stone_h + oy - 2],
            radius=2,
            fill=(base_r, base_g, base_b),
            outline=(base_r - 25, base_g - 25, base_b - 25)
        )

# === WARM LIGHT OVERLAY ===
light_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
light_draw = ImageDraw.Draw(light_layer)

# Warm afternoon light from upper left
for i in range(50):
    alpha = max(0, 15 - i // 4)
    radius = 200 + i * 40
    light_draw.ellipse(
        [WIDTH // 3 - radius, -radius,
         WIDTH // 3 + radius, radius],
        fill=(255, 200, 120, alpha)
    )

img = Image.alpha_composite(img.convert("RGBA"), light_layer).convert("RGB")

# === DEPTH OF FIELD (blur the background buildings) ===
# Create a depth mask for selective blur
mask = Image.new("L", (WIDTH, HEIGHT), 0)
mask_draw = ImageDraw.Draw(mask)
for y in range(HEIGHT):
    if y < horizon_y:
        # Sky and buildings: blur more
        val = int(200 - (y / horizon_y) * 100)
    else:
        depth = (y - horizon_y) / (HEIGHT - horizon_y)
        if depth < 0.3:
            val = int(150 * (1 - depth / 0.3))  # Near ground blurry
        else:
            val = 0  # Sharp in foreground
    mask_draw.line([(0, y), (WIDTH, y)], fill=val)

# Apply gaussian blur to background
blurred = img.filter(ImageFilter.GaussianBlur(radius=8))
img = Image.composite(blurred, img, mask)

# === PEDESTRIAN SILHOUETTES (blurred in background) ===
ped_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
ped_draw = ImageDraw.Draw(ped_layer)

for _ in range(8):
    px = random.randint(100, WIDTH - 100)
    py = int(horizon_y + random.randint(10, 80))
    ph = random.randint(30, 70)
    pw = ph // 3

    # Dark silhouette
    gray = random.randint(60, 100)
    alpha = random.randint(40, 80)
    ped_draw.ellipse([px - pw // 2, py - ph, px + pw // 2, py],
                     fill=(gray, gray, gray, alpha))
    # Head
    ped_draw.ellipse([px - pw // 4, py - ph - pw // 2,
                      px + pw // 4, py - ph + pw // 4],
                     fill=(gray, gray, gray, alpha))

ped_layer = ped_layer.filter(ImageFilter.GaussianBlur(radius=6))
img = Image.alpha_composite(img.convert("RGBA"), ped_layer).convert("RGB")

# === SUBTLE VIGNETTE ===
vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
vig_draw = ImageDraw.Draw(vignette)
for i in range(30):
    alpha = i
    margin = i * 15
    vig_draw.rectangle(
        [margin, margin, WIDTH - margin, HEIGHT - margin],
        outline=(0, 0, 0, alpha)
    )
vignette = vignette.filter(ImageFilter.GaussianBlur(radius=20))
img = Image.alpha_composite(img.convert("RGBA"), vignette).convert("RGB")

# === FILM GRAIN ===
grain = np.random.normal(0, 3, (HEIGHT, WIDTH, 3)).astype(np.int16)
img_arr = np.array(img).astype(np.int16) + grain
img_arr = np.clip(img_arr, 0, 255).astype(np.uint8)
img = Image.fromarray(img_arr)

img.save("dublin_grafton_street_bg.png", quality=95)
print(f"Saved dublin_grafton_street_bg.png ({os.path.getsize('dublin_grafton_street_bg.png')} bytes)")
print(f"  Size: {WIDTH}x{HEIGHT}")
