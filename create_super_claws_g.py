#!/usr/bin/env python3
"""
Create a procedural 'Super Claws G' character model.
A cute chunky clay superhero cat figure - round body, big head, stubby limbs, cape, claw hands.
Export as .glb with clay-like material properties.
"""
import numpy as np
import trimesh
from trimesh.creation import icosphere, cylinder, capsule

def make_color_material(r, g, b, a=255, roughness=0.9, metallic=0.0):
    """Create a PBR-like color array for vertices."""
    return np.array([r, g, b, a], dtype=np.uint8)

def color_mesh(mesh, r, g, b, a=255):
    """Apply a uniform vertex color to a mesh."""
    colors = np.full((len(mesh.vertices), 4), [r, g, b, a], dtype=np.uint8)
    mesh.visual.vertex_colors = colors
    return mesh

def create_super_claws_g():
    parts = []

    # === BODY (chunky round torso) ===
    body = icosphere(subdivisions=3, radius=1.0)
    body.apply_transform(trimesh.transformations.scale_matrix(1.0, direction=[1, 0, 0]))
    body.apply_transform(trimesh.transformations.scale_matrix(1.15, direction=[0, 1, 0]))
    body.apply_transform(trimesh.transformations.scale_matrix(0.85, direction=[0, 0, 1]))
    color_mesh(body, 255, 165, 50)  # Orange clay cat
    parts.append(body)

    # === HEAD (big round head) ===
    head = icosphere(subdivisions=3, radius=0.72)
    head.apply_translation([0, 1.45, 0])
    color_mesh(head, 255, 175, 60)
    parts.append(head)

    # === EARS (two triangular cat ears) ===
    for side in [-1, 1]:
        ear = trimesh.creation.cone(radius=0.18, height=0.35)
        ear.apply_translation([side * 0.38, 2.05, 0])
        ear.apply_transform(trimesh.transformations.rotation_matrix(
            side * 0.2, [0, 0, 1], point=[side * 0.38, 2.05, 0]))
        color_mesh(ear, 255, 140, 40)
        parts.append(ear)

    # === EYES (two big cute eyes) ===
    for side in [-1, 1]:
        # White part
        eye_white = icosphere(subdivisions=2, radius=0.16)
        eye_white.apply_translation([side * 0.25, 1.55, 0.58])
        color_mesh(eye_white, 240, 240, 240)
        parts.append(eye_white)
        # Pupil
        pupil = icosphere(subdivisions=2, radius=0.09)
        pupil.apply_translation([side * 0.25, 1.55, 0.68])
        color_mesh(pupil, 30, 30, 30)
        parts.append(pupil)
        # Highlight
        highlight = icosphere(subdivisions=1, radius=0.04)
        highlight.apply_translation([side * 0.22, 1.58, 0.72])
        color_mesh(highlight, 255, 255, 255)
        parts.append(highlight)

    # === NOSE ===
    nose = icosphere(subdivisions=2, radius=0.07)
    nose.apply_translation([0, 1.38, 0.68])
    color_mesh(nose, 255, 100, 120)
    parts.append(nose)

    # === MOUTH (smile - a small torus arc) ===
    mouth = trimesh.creation.annulus(r_min=0.01, r_max=0.03, height=0.02)
    mouth.apply_transform(trimesh.transformations.scale_matrix(3.0, direction=[1, 0, 0]))
    mouth.apply_translation([0, 1.30, 0.66])
    color_mesh(mouth, 180, 80, 80)
    parts.append(mouth)

    # === ARMS (stubby with big claw hands) ===
    for side in [-1, 1]:
        # Arm
        arm = capsule(height=0.5, radius=0.2)
        arm.apply_transform(trimesh.transformations.rotation_matrix(
            side * 0.8, [0, 0, 1]))
        arm.apply_translation([side * 1.1, 0.3, 0])
        color_mesh(arm, 255, 165, 50)
        parts.append(arm)

        # Claw hand (3 claws)
        for ci, angle in enumerate([-0.4, 0, 0.4]):
            claw = trimesh.creation.cone(radius=0.06, height=0.25)
            claw.apply_transform(trimesh.transformations.rotation_matrix(
                angle + side * 0.5, [0, 0, 1]))
            claw.apply_translation([side * 1.45 + np.sin(angle) * 0.1,
                                    0.1 + ci * 0.08 - 0.08,
                                    np.cos(angle) * 0.08])
            color_mesh(claw, 220, 220, 200)  # Bone/cream colored claws
            parts.append(claw)

    # === LEGS (short stubby) ===
    for side in [-1, 1]:
        leg = capsule(height=0.35, radius=0.22)
        leg.apply_translation([side * 0.4, -1.15, 0])
        color_mesh(leg, 255, 165, 50)
        parts.append(leg)

        # Feet
        foot = icosphere(subdivisions=2, radius=0.25)
        foot.apply_transform(trimesh.transformations.scale_matrix(1.3, direction=[0, 0, 1]))
        foot.apply_translation([side * 0.4, -1.55, 0.1])
        color_mesh(foot, 255, 155, 40)
        parts.append(foot)

    # === CAPE (superhero cape on the back) ===
    # Create cape as a deformed box
    cape_verts = np.array([
        [-0.6, 0.8, -0.4],   # top left
        [0.6, 0.8, -0.4],    # top right
        [0.8, -1.0, -0.7],   # bottom right (flared)
        [-0.8, -1.0, -0.7],  # bottom left (flared)
        [-0.5, 0.8, -0.5],   # back top left
        [0.5, 0.8, -0.5],    # back top right
        [0.7, -1.0, -0.8],   # back bottom right
        [-0.7, -1.0, -0.8],  # back bottom left
    ])
    cape_faces = np.array([
        [0, 1, 2], [0, 2, 3],  # front
        [4, 6, 5], [4, 7, 6],  # back
        [0, 4, 5], [0, 5, 1],  # top
        [2, 6, 7], [2, 7, 3],  # bottom
        [0, 3, 7], [0, 7, 4],  # left
        [1, 5, 6], [1, 6, 2],  # right
    ])
    cape = trimesh.Trimesh(vertices=cape_verts, faces=cape_faces)
    cape.fix_normals()
    color_mesh(cape, 200, 30, 30)  # Red superhero cape
    parts.append(cape)

    # === BELT (superhero utility belt) ===
    belt = trimesh.creation.annulus(r_min=0.75, r_max=0.85, height=0.15)
    belt.apply_translation([0, -0.2, 0])
    color_mesh(belt, 255, 215, 0)  # Gold belt
    parts.append(belt)

    # === BELT BUCKLE (letter G) ===
    buckle = trimesh.creation.box(extents=[0.25, 0.25, 0.15])
    buckle.apply_translation([0, -0.2, 0.82])
    color_mesh(buckle, 255, 230, 50)  # Gold buckle
    parts.append(buckle)

    # === TAIL (curly cat tail) ===
    tail_points = []
    for t in np.linspace(0, 2.5, 20):
        x = -0.3 * np.sin(t * 2)
        y = -0.5 - t * 0.3
        z = -0.6 - t * 0.15
        tail_points.append([x, y, z])

    for i in range(len(tail_points) - 1):
        seg = capsule(height=0.12, radius=0.08)
        mid = np.array(tail_points[i])
        seg.apply_translation(mid)
        color_mesh(seg, 255, 155, 40)
        parts.append(seg)

    # Combine all parts
    combined = trimesh.util.concatenate(parts)

    # Center and normalize
    combined.apply_translation(-combined.centroid)

    return combined


if __name__ == "__main__":
    import os
    os.chdir("/home/user/laurence_photos")

    print("Creating Super Claws G character model...")
    model = create_super_claws_g()

    # Export as GLB
    model.export("g_retextured.glb")
    print(f"Exported g_retextured.glb ({os.path.getsize('g_retextured.glb')} bytes)")
    print(f"  Vertices: {len(model.vertices)}")
    print(f"  Faces: {len(model.faces)}")

    # Also export the base model
    model.export("g_original.glb")
    print("Exported g_original.glb (base model)")
