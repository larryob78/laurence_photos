#!/usr/bin/env python3
"""
Crop the 3 Super Claws characters from the source image into individual PNGs.
Left: Orange/green caped hero with goggles
Center: Blue hero "G" with yellow hair
Right: Red angry hulk-type hero
"""
from PIL import Image, ImageFilter
import os

os.chdir("/home/user/laurence_photos")

# The image was provided inline - let's find it
# It should be the most recently accessed image or we read from stdin
# Actually, we need to save the source image first. Let me check what we have.

# Read the source image (user uploaded it in the conversation)
# We need to save it from the conversation. Let me check /tmp or recent files.
import glob

# Find the source image
candidates = glob.glob("/tmp/**/*.png", recursive=True) + \
             glob.glob("/tmp/**/*.jpg", recursive=True) + \
             glob.glob("/tmp/**/*.jpeg", recursive=True) + \
             glob.glob("/tmp/**/*.webp", recursive=True)

# Filter to reasonable sizes (the source image should be a certain dimension)
for f in sorted(candidates, key=os.path.getmtime, reverse=True):
    try:
        img = Image.open(f)
        w, h = img.size
        print(f"Found: {f} ({w}x{h})")
        if w > 800 and h > 300:  # Looks like our source
            print(f"  -> Using this as source")
            break
    except:
        continue
else:
    # If not found in /tmp, the image was shown inline.
    # We'll create from the rendered view. Let's just manually define crop regions
    # based on the known image dimensions (approximately 1340x488 from the display)
    print("Source image not found in /tmp, will attempt alternative approach")
    img = None

if img is not None:
    source = img.convert("RGBA")
    w, h = source.size
    print(f"Source dimensions: {w}x{h}")

    # The 3 characters are roughly equally spaced
    # Character 1 (left): ~0-33% width
    # Character 2 (center): ~33-66% width
    # Character 3 (right): ~66-100% width

    third = w // 3
    padding = 20  # overlap padding

    chars = [
        ("character_left_goggles", 0, max(0, third + padding)),
        ("character_center_G", max(0, third - padding), min(w, 2 * third + padding)),
        ("character_right_hulk", max(0, 2 * third - padding), w),
    ]

    for name, x1, x2 in chars:
        # Crop with some vertical trimming (remove excess whitespace)
        crop = source.crop((x1, 0, x2, h))

        # Trim whitespace
        bbox = crop.getbbox()
        if bbox:
            # Add small margin
            margin = 15
            bbox = (
                max(0, bbox[0] - margin),
                max(0, bbox[1] - margin),
                min(crop.width, bbox[2] + margin),
                min(crop.height, bbox[3] + margin),
            )
            crop = crop.crop(bbox)

        # Save
        outpath = f"{name}.png"
        crop.save(outpath)
        print(f"Saved {outpath}: {crop.size}")

print("\nDone cropping characters!")
