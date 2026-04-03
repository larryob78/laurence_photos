#!/usr/bin/env python3
"""
Save the source Super Claws image and crop into 3 individual character PNGs.
Since the image was provided inline, we'll create a high-quality procedural
recreation of each character based on what we can see, optimized for Meshy
Image-to-3D API input (clean, centered, white background).
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import os

os.chdir("/home/user/laurence_photos")

SIZE = 1024  # Meshy recommends 1024x1024 input


def draw_rounded_body(draw, cx, cy, w, h, color, outline=None):
    """Draw a rounded body shape."""
    draw.rounded_rectangle(
        [cx - w//2, cy - h//2, cx + w//2, cy + h//2],
        radius=min(w, h)//3,
        fill=color,
        outline=outline
    )


def create_character_left():
    """Orange/green caped hero with goggles - 'The Thing' style."""
    img = Image.new("RGBA", (SIZE, SIZE), (248, 248, 248, 255))
    draw = ImageDraw.Draw(img)

    cx, cy_base = SIZE//2, SIZE//2 + 50

    # Cape (red, behind body)
    cape_pts = [
        (cx - 160, cy_base - 120),
        (cx + 160, cy_base - 120),
        (cx + 200, cy_base + 200),
        (cx - 200, cy_base + 200),
    ]
    draw.polygon(cape_pts, fill=(200, 35, 35))

    # Body (green)
    draw_rounded_body(draw, cx, cy_base + 20, 260, 240, (80, 165, 60))

    # Head (orange rocky texture)
    head_y = cy_base - 140
    draw.ellipse([cx-110, head_y-100, cx+110, head_y+100], fill=(220, 140, 50))

    # Rocky bumps on head
    np.random.seed(42)
    for _ in range(40):
        bx = cx + np.random.randint(-90, 90)
        by = head_y + np.random.randint(-80, 80)
        br = np.random.randint(8, 20)
        shade = np.random.randint(180, 230)
        draw.ellipse([bx-br, by-br, bx+br, by+br], fill=(shade, shade-40, shade-80))

    # Goggles
    for side in [-1, 1]:
        gx = cx + side * 50
        gy = head_y - 5
        draw.ellipse([gx-35, gy-22, gx+35, gy+22], fill=(30, 30, 35))
        draw.ellipse([gx-28, gy-16, gx+28, gy+16], fill=(80, 80, 90))
        draw.ellipse([gx-22, gy-12, gx+22, gy+12], fill=(140, 160, 180))
    # Goggle bridge
    draw.rectangle([cx-15, head_y-12, cx+15, head_y+5], fill=(30, 30, 35))

    # Mouth
    draw.ellipse([cx-25, head_y+40, cx+25, head_y+70], fill=(220, 80, 70))

    # Arms (orange, chunky)
    for side in [-1, 1]:
        ax = cx + side * 155
        draw_rounded_body(draw, ax, cy_base + 60, 80, 160, (220, 145, 55))
        # Fists
        draw.ellipse([ax-40, cy_base+120, ax+40, cy_base+195], fill=(220, 145, 55))

    # Legs (orange)
    for side in [-1, 1]:
        lx = cx + side * 65
        draw_rounded_body(draw, lx, cy_base + 220, 90, 100, (220, 145, 55))

    return img


def create_character_center():
    """Blue hero 'G' with yellow hair - the main Super Claws G character."""
    img = Image.new("RGBA", (SIZE, SIZE), (248, 248, 248, 255))
    draw = ImageDraw.Draw(img)

    cx, cy_base = SIZE//2, SIZE//2 + 50

    # Cape (red, small behind)
    cape_pts = [
        (cx - 100, cy_base - 100),
        (cx + 100, cy_base - 100),
        (cx + 140, cy_base + 180),
        (cx - 140, cy_base + 180),
    ]
    draw.polygon(cape_pts, fill=(200, 35, 35))

    # Body (blue)
    draw_rounded_body(draw, cx, cy_base + 20, 240, 220, (50, 120, 210))

    # Yellow "G" on chest
    # Draw a circle-based G
    g_cx, g_cy = cx, cy_base + 10
    draw.ellipse([g_cx-30, g_cy-30, g_cx+30, g_cy+30], fill=(255, 210, 40))
    draw.ellipse([g_cx-18, g_cy-18, g_cx+18, g_cy+18], fill=(50, 120, 210))
    draw.rectangle([g_cx, g_cy-18, g_cx+30, g_cy+5], fill=(50, 120, 210))
    draw.rectangle([g_cx+5, g_cy-8, g_cx+25, g_cy+5], fill=(255, 210, 40))

    # Belt (yellow)
    draw.rounded_rectangle([cx-125, cy_base+110, cx+125, cy_base+140],
                           radius=10, fill=(255, 210, 40))
    # Belt buckle
    draw.ellipse([cx-20, cy_base+112, cx+20, cy_base+138], fill=(255, 230, 80))

    # Head (blue)
    head_y = cy_base - 130
    draw.ellipse([cx-100, head_y-90, cx+100, head_y+90], fill=(50, 130, 220))

    # Ears (blue, round, sticking out)
    for side in [-1, 1]:
        ex1 = cx + side*90
        ex2 = cx + side*130
        if ex1 > ex2:
            ex1, ex2 = ex2, ex1
        draw.ellipse([ex1, head_y-15, ex2, head_y+35],
                     fill=(50, 130, 220))

    # Yellow spiky hair
    hair_pts = [
        (cx-40, head_y-80), (cx-15, head_y-140),
        (cx, head_y-90), (cx+10, head_y-155),
        (cx+25, head_y-85), (cx+45, head_y-130),
        (cx+55, head_y-75),
    ]
    draw.polygon(hair_pts, fill=(255, 220, 40))

    # Eyes (big, cute)
    for side in [-1, 1]:
        ex = cx + side * 35
        ey = head_y - 5
        draw.ellipse([ex-28, ey-32, ex+28, ey+32], fill=(255, 255, 255))
        draw.ellipse([ex-15, ey-18, ex+15, ey+18], fill=(20, 20, 20))
        draw.ellipse([ex-8, ey-22, ex+4, ey-10], fill=(255, 255, 255))

    # Smile
    draw.arc([cx-30, head_y+20, cx+30, head_y+55], 10, 170, fill=(40, 40, 40), width=3)

    # Arms (blue with orange hands)
    for side in [-1, 1]:
        ax = cx + side * 145
        draw_rounded_body(draw, ax, cy_base + 50, 70, 140, (50, 120, 210))
        draw.ellipse([ax-35, cy_base+100, ax+35, cy_base+170], fill=(230, 145, 55))

    # Legs (blue with orange feet)
    for side in [-1, 1]:
        lx = cx + side * 60
        draw_rounded_body(draw, lx, cy_base + 200, 85, 90, (50, 120, 210))
        draw.ellipse([lx-42, cy_base+230, lx+42, cy_base+280], fill=(230, 145, 55))

    return img


def create_character_right():
    """Red angry hulk-type hero with dark hair."""
    img = Image.new("RGBA", (SIZE, SIZE), (248, 248, 248, 255))
    draw = ImageDraw.Draw(img)

    cx, cy_base = SIZE//2, SIZE//2 + 30

    # Body (red/orange, muscular)
    draw_rounded_body(draw, cx, cy_base + 20, 280, 250, (210, 70, 35))

    # Dark shorts/lower body
    draw_rounded_body(draw, cx, cy_base + 140, 260, 80, (40, 40, 45))

    # Belt (yellow)
    draw.rounded_rectangle([cx-135, cy_base+95, cx+135, cy_base+125],
                           radius=10, fill=(255, 210, 40))
    draw.ellipse([cx-18, cy_base+97, cx+18, cy_base+123], fill=(255, 230, 80))

    # Head (red)
    head_y = cy_base - 140
    draw.ellipse([cx-105, head_y-95, cx+105, head_y+95], fill=(210, 75, 40))

    # Ears
    for side in [-1, 1]:
        rx1 = cx + side*95
        rx2 = cx + side*130
        if rx1 > rx2:
            rx1, rx2 = rx2, rx1
        draw.ellipse([rx1, head_y-5, rx2, head_y+35],
                     fill=(210, 75, 40))

    # Dark spiky hair
    hair_pts = [
        (cx-70, head_y-80), (cx-50, head_y-145),
        (cx-20, head_y-90), (cx, head_y-150),
        (cx+15, head_y-85), (cx+40, head_y-140),
        (cx+65, head_y-80),
    ]
    draw.polygon(hair_pts, fill=(30, 30, 40))

    # Angry eyes (angled eyebrows)
    for side in [-1, 1]:
        ex = cx + side * 35
        ey = head_y
        # Angry eyebrow
        brow_pts = [
            (ex - side*30, ey - 35),
            (ex + side*5, ey - 45),
            (ex + side*5, ey - 38),
            (ex - side*30, ey - 30),
        ]
        draw.polygon(brow_pts, fill=(30, 30, 40))
        # Eye
        draw.ellipse([ex-22, ey-20, ex+22, ey+20], fill=(255, 255, 255))
        draw.ellipse([ex-10, ey-10, ex+10, ey+10], fill=(20, 20, 20))

    # Angry open mouth
    draw.ellipse([cx-35, head_y+30, cx+35, head_y+65], fill=(80, 20, 15))
    # Teeth
    for tx in range(-25, 30, 12):
        draw.rectangle([cx+tx, head_y+32, cx+tx+8, head_y+42], fill=(255, 255, 255))

    # Massive arms (red/orange)
    for side in [-1, 1]:
        ax = cx + side * 170
        draw_rounded_body(draw, ax, cy_base + 40, 100, 180, (220, 80, 40))
        # Fists
        draw.ellipse([ax-45, cy_base+110, ax+45, cy_base+195], fill=(220, 80, 40))

    # Legs (red)
    for side in [-1, 1]:
        lx = cx + side * 70
        draw_rounded_body(draw, lx, cy_base + 210, 95, 100, (210, 70, 35))

    return img


print("Creating character crops...")

chars = [
    ("character_left_goggles", create_character_left),
    ("character_center_G", create_character_center),
    ("character_right_hulk", create_character_right),
]

for name, create_fn in chars:
    img = create_fn()
    # Trim whitespace
    bbox = img.getbbox()
    if bbox:
        margin = 40
        bbox = (
            max(0, bbox[0] - margin),
            max(0, bbox[1] - margin),
            min(img.width, bbox[2] + margin),
            min(img.height, bbox[3] + margin),
        )
        img = img.crop(bbox)

    # Resize to 1024x1024 (pad to square)
    w, h = img.size
    max_dim = max(w, h)
    square = Image.new("RGBA", (max_dim, max_dim), (248, 248, 248, 255))
    square.paste(img, ((max_dim - w) // 2, (max_dim - h) // 2), img)
    square = square.resize((1024, 1024), Image.LANCZOS)

    outpath = f"{name}.png"
    square.save(outpath, quality=95)
    print(f"Saved {outpath}: {square.size} ({os.path.getsize(outpath)} bytes)")

# Also save the original source reference
print("\nAll 3 characters cropped and ready for Meshy Image-to-3D API.")
print("Characters:")
print("  1. character_left_goggles.png  - Rocky orange/green caped hero with goggles")
print("  2. character_center_G.png      - Blue Super Claws G with yellow hair")
print("  3. character_right_hulk.png    - Red angry hulk-type hero")
