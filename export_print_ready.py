#!/usr/bin/env python3
"""
Export g_retextured.glb as a watertight, manifold .obj file
scaled to 10cm height, suitable for 3D printing.
"""
import trimesh
import numpy as np
import os

os.chdir("/home/user/laurence_photos")

print("Loading model...")
model = trimesh.load("g_retextured.glb")
if isinstance(model, trimesh.Scene):
    model = trimesh.util.concatenate(list(model.geometry.values()))

print(f"Original mesh: {len(model.vertices)} verts, {len(model.faces)} faces")
print(f"  Is watertight: {model.is_watertight}")
print(f"  Is volume: {model.is_volume}")

# Center the model
model.apply_translation(-model.centroid)

# Scale to 10cm height (100mm)
bounds = model.bounds
current_height = bounds[1][1] - bounds[0][1]
target_height = 100.0  # mm
scale_factor = target_height / current_height
model.apply_scale(scale_factor)

new_bounds = model.bounds
print(f"  Scaled dimensions (mm): {new_bounds[1] - new_bounds[0]}")

# Fix mesh issues
print("Fixing mesh...")

# Remove degenerate faces
mask = model.nondegenerate_faces()
model.update_faces(mask)
model.remove_unreferenced_vertices()

# Fix normals
model.fix_normals()

# Fill holes to make watertight
if not model.is_watertight:
    print("  Mesh not watertight, attempting to fill holes...")
    model.fill_holes()

# Try to make it a proper volume using convex hull as fallback
if not model.is_watertight:
    print("  Still not watertight after hole fill.")
    print("  Applying voxel-based repair...")
    try:
        # Voxel remesh for watertightness
        pitch = max(model.extents) / 100  # ~100 voxels along longest axis
        voxelized = model.voxelized(pitch)
        model = voxelized.marching_cubes

        # Re-scale after voxel repair
        bounds = model.bounds
        current_height = bounds[1][1] - bounds[0][1]
        scale_factor = target_height / current_height
        model.apply_scale(scale_factor)
        model.apply_translation(-model.centroid)
    except Exception as e:
        print(f"  Voxel repair failed ({e}), using convex hull fallback...")
        model = model.convex_hull
        bounds = model.bounds
        current_height = bounds[1][1] - bounds[0][1]
        scale_factor = target_height / current_height
        model.apply_scale(scale_factor)
        model.apply_translation(-model.centroid)

print(f"\nFinal mesh stats:")
print(f"  Vertices: {len(model.vertices)}")
print(f"  Faces: {len(model.faces)}")
print(f"  Is watertight: {model.is_watertight}")
print(f"  Is volume: {model.is_volume}")

final_bounds = model.bounds
dims = final_bounds[1] - final_bounds[0]
print(f"  Dimensions (mm): {dims[0]:.1f} x {dims[1]:.1f} x {dims[2]:.1f}")
print(f"  Height: {dims[1]:.1f}mm")

# Check for non-manifold edges
edges = model.edges_sorted
unique_edges, counts = np.unique(edges, axis=0, return_counts=True)
non_manifold = np.sum(counts > 2)
print(f"  Non-manifold edges: {non_manifold}")

if non_manifold > 0:
    print("  Warning: Some non-manifold edges detected.")
    print("  For production printing, recommend further repair in MeshLab/Meshmixer.")

# Export
model.export("g_print_ready.obj")
print(f"\nSaved g_print_ready.obj ({os.path.getsize('g_print_ready.obj')} bytes)")
