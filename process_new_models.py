#!/usr/bin/env python3
"""Process new models for xianxia-explorer"""
import trimesh
import numpy as np
import os
import time

os.makedirs('public/models', exist_ok=True)

# ============================================================
# 1. Process new PLY world → world_area2.glb
# ============================================================
print("=" * 60)
print("1/6: Processing new PLY world...")
t0 = time.time()
m = trimesh.load('a5b4df5b41164264a9bcdc759df4ad24.ply', force='mesh')
print(f"  Loaded: {len(m.vertices):,} verts, {len(m.faces):,} faces in {time.time()-t0:.1f}s")

# Center and land
b = m.bounds
m.vertices[:, 0] -= (b[0][0] + b[1][0]) / 2  # X center
m.vertices[:, 1] -= b[0][1]                   # land Y>=0
m.vertices[:, 2] -= (b[0][2] + b[1][2]) / 2   # Z center

# Height-based color enhancement (xianxia style)
vc = m.visual.vertex_colors
y_min = m.vertices[:, 1].min()
y_max = m.vertices[:, 1].max()
y_range = y_max - y_min
print(f"  Y range: {y_min:.2f} to {y_max:.2f} ({y_range:.2f}m)")

for i in range(len(m.vertices)):
    y = m.vertices[i, 1]
    pct = (y - y_min) / y_range if y_range > 0 else 0
    if pct < 0.12:
        r, g, b = 25, 75, 185       # deep water
    elif pct < 0.30:
        r, g, b = 45, 135, 40       # lush green ground
    elif pct < 0.50:
        r, g, b = 105, 148, 55      # yellow-green hills
    elif pct < 0.72:
        r, g, b = 155, 125, 85      # brown rocky
    else:
        r, g, b = 230, 225, 215     # white-grey peaks
    vc[i] = [r, g, b, 255]

t0 = time.time()
m.export('public/models/world_area2.glb', file_type='glb')
print(f"  ✅ Exported world_area2.glb ({os.path.getsize('public/models/world_area2.glb')/1024/1024:.1f}MB) in {time.time()-t0:.1f}s")

# ============================================================
# 2-6. Simplify 5 GLB building models → ~50K faces each
# ============================================================
buildings = [
    ('44767368eaddc07d0bc8aafd6790c6a2.glb', 'building_temple.glb', '道观大殿'),
    ('7464f79a22bb37a7f9347a6d06eeea1c.glb', 'building_pagoda.glb', '七层宝塔'),
    ('b47cff3b9d28d0b538c981cb1586c155.glb', 'building_spirittree.glb', '灵树'),
    ('dd739dae82e35053dcecac05b5b7f4cf.glb', 'building_shanmen.glb', '山门'),
    ('f780bb3e412360cf8d95ab9b70c9dfbd.glb', 'building_bridge.glb', '仙桥'),
]

for idx, (src, dst, name) in enumerate(buildings, 2):
    print(f"\n{'='*60}")
    print(f"{idx}/6: Processing {name} ({src[:16]}...)")

    t0 = time.time()
    m = trimesh.load(src, force='mesh')
    print(f"  Loaded: {len(m.vertices):,} verts, {len(m.faces):,} faces in {time.time()-t0:.1f}s")

    # Simplify to ~45K faces using fast_simplification directly
    target = 45000
    ratio = target / len(m.faces)
    print(f"  Simplifying to ~{target:,} faces ({ratio:.1%})...")
    t1 = time.time()
    from fast_simplification import simplify as fast_simplify
    new_verts, new_faces = fast_simplify(
        m.vertices.astype('float32'),
        m.faces.astype('uint32'),
        target_count=target,
        agg=7,  # preserve vertex attributes
    )
    simplified = trimesh.Trimesh(
        vertices=new_verts,
        faces=new_faces,
        process=False,
    )
    print(f"  Done: {len(simplified.vertices):,} verts, {len(simplified.faces):,} faces in {time.time()-t1:.1f}s")

    # Center and land
    b = simplified.bounds
    cx = (b[0][0] + b[1][0]) / 2
    cy = b[0][1]
    cz = (b[0][2] + b[1][2]) / 2
    simplified.vertices[:, 0] -= cx
    simplified.vertices[:, 1] -= cy
    simplified.vertices[:, 2] -= cz

    # Add mythological vertex colors by height
    b2 = simplified.bounds
    y_min = b2[0][1]
    y_max = b2[1][1]
    y_range = y_max - y_min

    # Create vertex colors
    colors = np.zeros((len(simplified.vertices), 4), dtype=np.uint8)
    for i in range(len(simplified.vertices)):
        y = simplified.vertices[i, 1]
        pct = (y - y_min) / y_range if y_range > 0 else 0.5

        if pct < 0.15:
            # Base/ground — dark stone
            r, g, b = 120, 105, 85
        elif pct < 0.70:
            # Body — vermillion red to gold transition
            t = (pct - 0.15) / 0.55
            r = int(130 + t * 75)
            g = int(40 + t * 120)
            b = int(30 + t * 10)
        else:
            # Top/roof — gold
            r, g, b = 218, 165, 32

        # Slight random variation
        rr = np.random.randint(-8, 9)
        rg = np.random.randint(-8, 9)
        rb = np.random.randint(-5, 6)
        colors[i] = [
            max(0, min(255, r + rr)),
            max(0, min(255, g + rg)),
            max(0, min(255, b + rb)),
            255
        ]

    simplified.visual.vertex_colors = colors

    t1 = time.time()
    simplified.export(f'public/models/{dst}', file_type='glb')
    sz = os.path.getsize(f'public/models/{dst}')/1024/1024
    print(f"  ✅ Exported {dst} ({sz:.1f}MB) in {time.time()-t1:.1f}s")
    print(f"     Size: {b2[1][0]-b2[0][0]:.2f}×{b2[1][1]-b2[0][1]:.2f}×{b2[1][2]-b2[0][2]:.2f}m")

print(f"\n{'='*60}")
print("✅ All models processed!")
print(f"Files in public/models/:")
for f in sorted(os.listdir('public/models')):
    sz = os.path.getsize(f'public/models/{f}')/1024/1024
    print(f"  {f} ({sz:.1f}MB)")
