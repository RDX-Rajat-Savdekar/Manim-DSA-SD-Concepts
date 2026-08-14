"""
Blender 3.6 / 4.x — run in Scripting workspace with Iron Man armature selected
(or with the imported Mark 85 collection active).

Renames Sketchfab-style bones:
  mixamorigHips_01  →  mixamorigHips
  mixamorigLeftArm_09 → mixamorigLeftArm
so Mixamo FBX actions (Without Skin) can be assigned directly.
"""

import re
import bpy


def canonical_mixamo_name(name: str) -> str:
    n = name
    # mixamorig:Hips → mixamorigHips
    n = n.replace("mixamorig:", "mixamorig")
    # mixamorigHips_01 / mixamorigLeftArm_09 → strip _digits suffix
    n = re.sub(r"_0*\d+$", "", n)
    return n


def find_armatures():
    return [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]


def rename_armature_bones(arm_obj):
    arm = arm_obj.data
    # Must rename in Edit mode safely via data.bones / edit_bones
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="OBJECT")

    mapping = []
    # Collect first (can't rename while iterating oddly with collisions)
    planned = []
    for bone in arm.bones:
        new = canonical_mixamo_name(bone.name)
        if new != bone.name:
            planned.append((bone.name, new))

    # Avoid collisions: rename to temp then final
    for old, new in planned:
        if new in arm.bones and new != old:
            print(f"SKIP collision: {old} → {new} (already exists)")
            continue
        bone = arm.bones.get(old)
        if not bone:
            continue
        temp = f"__tmp__{old}"
        bone.name = temp
        mapping.append((old, new))

    for old, new in mapping:
        bone = arm.bones.get(f"__tmp__{old}")
        if bone:
            bone.name = new
            print(f"RENAME  {old}  →  {new}")

    return mapping


def main():
    arms = find_armatures()
    if not arms:
        raise RuntimeError("No armature in scene. Import iron-man-rigged.glb first.")

    # Prefer the armature that has skinned meshes parented / modifier target
    target = bpy.context.active_object if bpy.context.active_object and bpy.context.active_object.type == "ARMATURE" else arms[0]
    for a in arms:
        # Heuristic: more bones ≈ character
        if len(a.data.bones) > len(target.data.bones):
            target = a

    print(f"\n=== Renaming bones on armature: {target.name} ({len(target.data.bones)} bones) ===")
    mapping = rename_armature_bones(target)
    print(f"Done. Renamed {len(mapping)} bones.\n")

    print("Current bone names (first 20):")
    for i, b in enumerate(target.data.bones):
        if i >= 20:
            print("…")
            break
        print(f"  {b.name}")


if __name__ == "__main__":
    main()
