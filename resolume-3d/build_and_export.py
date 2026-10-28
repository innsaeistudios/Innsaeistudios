"""
Innsaei Studios - audio-reactive club environment for Resolume Wire.

Run in Blender 4.x:
    blender --background --python build_and_export.py -- --out ./export
or open it in Blender's Text Editor and press Run Script.

What it does:
  1. Builds a tunnel/club environment out of clearly named parts.
  2. Gives each part an emissive material (glows well on LED walls).
  3. Exports every reactive group as its own OBJ (one Wire mesh node per group,
     so each one can be driven by a different audio band), plus one combined
     GLB for preview.

Every group sits at the world origin with its pivot at the centre, so scale
and rotation in Wire pulse around the right point.
"""

import argparse
import math
import os
import sys

import bpy

# ---------------------------------------------------------------- settings

SEED_RINGS = 24          # tunnel rings (the depth of the corridor)
RING_SPACING = 2.0
RING_RADIUS = 6.0
PILLARS_PER_SIDE = 8
CRYSTAL_COUNT = 12
GRID_SIZE = 60

# group name -> (emission colour, strength, intended audio band)
GROUPS = {
    "Rings":    ((0.10, 0.40, 1.00), 6.0, "LOW  - scale pulse on kick"),
    "Pillars":  ((1.00, 0.10, 0.60), 4.0, "LOW  - height bounce"),
    "Crystals": ((0.20, 1.00, 0.90), 8.0, "HIGH - spin + sparkle"),
    "Floor":    ((0.60, 0.20, 1.00), 3.0, "MID  - glow brightness"),
    "Core":     ((1.00, 0.85, 0.30), 10.0, "LEVEL - overall energy"),
    "Dome":     ((0.02, 0.02, 0.05), 0.5, "static backdrop"),
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", default=os.path.join(os.path.dirname(bpy.data.filepath) or os.getcwd(), "export"))
    return p.parse_args(argv)


# ---------------------------------------------------------------- helpers

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def emissive_material(name, color, strength):
    mat = bpy.data.materials.new(f"MAT_{name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
    bsdf.inputs["Emission Strength"].default_value = strength
    bsdf.inputs["Roughness"].default_value = 0.3
    return mat


def join_into(objs, name, mat):
    """Join a list of objects into one mesh named `name`, origin at world centre."""
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = obj.data.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


# ---------------------------------------------------------------- builders

def build_rings():
    parts = []
    for i in range(SEED_RINGS):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=RING_RADIUS, minor_radius=0.08,
            major_segments=64, minor_segments=8,
            location=(0, -i * RING_SPACING, 0), rotation=(math.radians(90), 0, 0))
        parts.append(bpy.context.object)
    return parts


def build_pillars():
    parts = []
    for side in (-1, 1):
        for i in range(PILLARS_PER_SIDE):
            y = -i * (SEED_RINGS * RING_SPACING / PILLARS_PER_SIDE)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(side * 4.5, y, -1.0))
            p = bpy.context.object
            p.scale = (0.25, 0.25, 4.0)
            parts.append(p)
    return parts


def build_crystals():
    parts = []
    for i in range(CRYSTAL_COUNT):
        a = i / CRYSTAL_COUNT * math.tau
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=1, radius=0.45,
            location=(math.cos(a) * 2.5, -8 + math.sin(a * 2) * 3, math.sin(a) * 2.5))
        c = bpy.context.object
        c.scale = (0.6, 0.6, 1.6)
        c.rotation_euler = (a, a * 0.5, 0)
        parts.append(c)
    return parts


def build_floor():
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=GRID_SIZE, y_subdivisions=GRID_SIZE,
                                    size=GRID_SIZE, location=(0, -GRID_SIZE / 2 + 10, -3))
    floor = bpy.context.object
    # wireframe gives the classic neon grid look; applied so the OBJ keeps it
    mod = floor.modifiers.new("Wire", "WIREFRAME")
    mod.thickness = 0.04
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return [floor]


def build_core():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.2, location=(0, -14, 0))
    return [bpy.context.object]


def build_dome():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=80, segments=32, ring_count=16, location=(0, 0, 0))
    dome = bpy.context.object
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.flip_normals()          # visible from inside
    bpy.ops.object.mode_set(mode="OBJECT")
    return [dome]


def add_camera():
    bpy.ops.object.camera_add(location=(0, 6, 0.5), rotation=(math.radians(90), 0, 0))
    cam = bpy.context.object
    cam.name = "Camera_Main"
    cam.data.lens = 24
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------- export

def export_group(obj, out_dir):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    path = os.path.join(out_dir, f"{obj.name}.obj")
    bpy.ops.wm.obj_export(filepath=path, export_selected_objects=True,
                          export_materials=True, export_normals=True, export_uv=True,
                          forward_axis="NEGATIVE_Z", up_axis="Y")
    return path


def main():
    args = parse_args()
    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    reset_scene()
    builders = {
        "Rings": build_rings, "Pillars": build_pillars, "Crystals": build_crystals,
        "Floor": build_floor, "Core": build_core, "Dome": build_dome,
    }
    groups = {}
    for name, (color, strength, _) in GROUPS.items():
        groups[name] = join_into(builders[name](), name, emissive_material(name, color, strength))
    add_camera()

    print("\nExporting to", out_dir)
    for name, obj in groups.items():
        print(f"  {export_group(obj, out_dir)}   <- {GROUPS[name][2]}")

    bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, "club_environment.glb"),
                              export_format="GLB", export_cameras=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "club_environment.blend"))
    print("Done.")


if __name__ == "__main__":
    main()
