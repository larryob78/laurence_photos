#!/usr/bin/env python3
"""
Submit character images to Meshy Image-to-3D API.
If MESHY_API_KEY is available, submits all 3 characters.
Downloads resulting .glb files when ready.
"""
import os
import sys
import json
import time
import base64
import urllib.request
import urllib.error

os.chdir("/home/user/laurence_photos")

API_KEY = os.environ.get("MESHY_API_KEY", "").strip()
if not API_KEY:
    # Try .env file
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("MESHY_API_KEY="):
                    API_KEY = line.split("=", 1)[1].strip().strip("'\"")

if not API_KEY:
    print("ERROR: MESHY_API_KEY not found in environment or .env file.")
    print("Please set MESHY_API_KEY and re-run this script.")
    print("\nThe following character images are ready for submission:")
    for f in ["character_left_goggles.png", "character_center_G.png", "character_right_hulk.png"]:
        if os.path.exists(f):
            print(f"  - {f} ({os.path.getsize(f)} bytes)")
    sys.exit(1)

BASE_URL = "https://api.meshy.ai/openapi/v2"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

CHARACTERS = [
    ("character_left_goggles.png", "g_left_goggles"),
    ("character_center_G.png", "g_center_super_g"),
    ("character_right_hulk.png", "g_right_hulk"),
]

TEXTURE_PROMPT = (
    "Handmade plasticine clay texture, warm matte finish, visible fingerprint "
    "impressions, slightly rough surface, Aardman animation studio quality, "
    "soft subsurface scattering, no gloss, no shine, organic imperfect clay material"
)


def submit_image_to_3d(image_path):
    """Submit an image to Meshy Image-to-3D API."""
    # Read and base64 encode the image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    payload = json.dumps({
        "image_url": f"data:image/png;base64,{image_data}",
        "enable_pbr": True,
        "should_remesh": True,
        "topology": "quad",
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/image-to-3d",
        data=payload,
        headers=HEADERS,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            return result.get("result", result)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  API Error {e.code}: {error_body}")
        return None


def check_task_status(task_id):
    """Check the status of a Meshy task."""
    req = urllib.request.Request(
        f"{BASE_URL}/image-to-3d/{task_id}",
        headers=HEADERS,
        method="GET"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def download_file(url, output_path):
    """Download a file from URL."""
    urllib.request.urlretrieve(url, output_path)


print(f"Meshy API Key found: {API_KEY[:8]}...")
print(f"Submitting {len(CHARACTERS)} characters to Image-to-3D API...\n")

task_ids = {}

# Submit all characters
for image_file, output_name in CHARACTERS:
    if not os.path.exists(image_file):
        print(f"  SKIP: {image_file} not found")
        continue

    print(f"Submitting {image_file}...")
    result = submit_image_to_3d(image_file)

    if result:
        task_id = result if isinstance(result, str) else result.get("id", result)
        task_ids[output_name] = task_id
        print(f"  Task ID: {task_id}")
    else:
        print(f"  Failed to submit {image_file}")

if not task_ids:
    print("\nNo tasks submitted successfully.")
    sys.exit(1)

# Poll for completion
print(f"\nWaiting for {len(task_ids)} tasks to complete...")
MAX_WAIT = 600  # 10 minutes
start_time = time.time()
completed = {}

while len(completed) < len(task_ids) and (time.time() - start_time) < MAX_WAIT:
    for name, task_id in task_ids.items():
        if name in completed:
            continue

        try:
            status = check_task_status(task_id)
            state = status.get("status", "unknown")

            if state == "SUCCEEDED":
                glb_url = status.get("model_urls", {}).get("glb", "")
                if glb_url:
                    output_path = f"{name}.glb"
                    print(f"  Downloading {name}.glb...")
                    download_file(glb_url, output_path)
                    print(f"  Saved {output_path} ({os.path.getsize(output_path)} bytes)")
                    completed[name] = output_path
                else:
                    print(f"  {name}: completed but no GLB URL found")
                    completed[name] = None

            elif state == "FAILED":
                print(f"  {name}: FAILED - {status.get('message', 'unknown error')}")
                completed[name] = None

            elif state in ("PENDING", "IN_PROGRESS"):
                progress = status.get("progress", 0)
                print(f"  {name}: {state} ({progress}%)")

        except Exception as e:
            print(f"  {name}: Error checking status: {e}")

    if len(completed) < len(task_ids):
        time.sleep(15)

elapsed = time.time() - start_time
print(f"\nDone in {elapsed:.0f}s")
print(f"Completed: {len(completed)}/{len(task_ids)}")

# Now retexture each model
print("\n--- Retexturing models ---")
for name, glb_path in completed.items():
    if not glb_path:
        continue

    print(f"\nRetexturing {glb_path}...")
    with open(glb_path, "rb") as f:
        model_data = base64.b64encode(f.read()).decode("utf-8")

    payload = json.dumps({
        "model_url": f"data:model/gltf-binary;base64,{model_data}",
        "object_prompt": "cute chunky clay superhero character figure",
        "style_prompt": TEXTURE_PROMPT,
        "enable_original_uv": False,
        "enable_pbr": True,
        "resolution": "2048",
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/text-to-texture",
        data=payload,
        headers={**HEADERS},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            tex_task_id = result.get("result", result)
            print(f"  Retexture task: {tex_task_id}")
            # Poll for texture completion
            for _ in range(40):
                time.sleep(15)
                try:
                    tex_req = urllib.request.Request(
                        f"{BASE_URL}/text-to-texture/{tex_task_id}",
                        headers=HEADERS
                    )
                    with urllib.request.urlopen(tex_req) as tresp:
                        tstatus = json.loads(tresp.read().decode())
                        tstate = tstatus.get("status", "unknown")
                        if tstate == "SUCCEEDED":
                            tex_glb = tstatus.get("model_urls", {}).get("glb", "")
                            if tex_glb:
                                retex_path = f"{name}_retextured.glb"
                                download_file(tex_glb, retex_path)
                                print(f"  Saved {retex_path}")
                            break
                        elif tstate == "FAILED":
                            print(f"  Retexture failed")
                            break
                        else:
                            print(f"  Retexture: {tstate}")
                except Exception as e:
                    print(f"  Error: {e}")
    except urllib.error.HTTPError as e:
        print(f"  Retexture API error {e.code}: {e.read().decode()}")

print("\nAll done!")
