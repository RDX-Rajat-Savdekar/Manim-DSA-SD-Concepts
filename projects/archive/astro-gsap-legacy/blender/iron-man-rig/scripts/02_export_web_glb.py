"""
Export Mark 85 + armature + animations to exports/iron-man-rigged.glb

Usage:
1. Clean scene: only Iron Man meshes + his armature (delete Mixamo FBX armatures).
2. Select armature + all related meshes.
3. Run this script.
"""

from pathlib import Path
import bpy


def project_root_from_blend():
    # Prefer folder next to this script: blender/iron-man-rig/
    here = Path(__file__).resolve().parent.parent
    return here


def main():
    root = project_root_from_blend()
    out_dir = root / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "iron-man-rigged.glb"

    # Ensure something is selected
    if not bpy.context.selected_objects:
        # Select all mesh + armature
        bpy.ops.object.select_all(action="DESELECT")
        for o in bpy.context.scene.objects:
            if o.type in {"MESH", "ARMATURE"}:
                o.select_set(True)
        if bpy.context.selected_objects:
            bpy.context.view_layer.objects.active = next(
                o for o in bpy.context.selected_objects if o.type == "ARMATURE"
            )

    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=True,
        export_frame_range=True,
        export_force_sampling=True,
        export_apply=False,
        export_skins=True,
        export_morph=False,
        export_lights=False,
        export_cameras=False,
    )
    print(f"Exported → {out}")
    print("Next: cp exports/iron-man-rigged.glb public/models/iron-man-rigged.glb")


if __name__ == "__main__":
    main()
