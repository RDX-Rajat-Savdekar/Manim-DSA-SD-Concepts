"""
One-shot scene bootstrap (optional).

Run from terminal:
  blender --background --python scripts/00_bootstrap_scene.py

Or open Blender → Scripting → Run Script.

Imports Mark 85, renames bones, imports Flying.fbx for reference.
Saves iron-man-rig.blend next to this project.
"""

from pathlib import Path
import bpy


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
BLEND = ROOT / "iron-man-rig.blend"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.actions:
        bpy.data.actions.remove(block)


def import_glb(path: Path):
    bpy.ops.import_scene.gltf(filepath=str(path))


def import_fbx(path: Path):
    bpy.ops.import_scene.fbx(
        filepath=str(path),
        automatic_bone_orientation=False,
        ignore_leaf_bones=True,
        use_anim=True,
    )


def main():
    clear_scene()
    suit = ASSETS / "iron-man-rigged.glb"
    fly = ASSETS / "Flying.fbx"
    if not suit.exists():
        raise SystemExit(f"Missing {suit}")

    import_glb(suit)
    print("Imported", suit.name)

    # Run rename in-process
    rename = Path(__file__).resolve().parent / "01_rename_mixamo_bones.py"
    exec(compile(rename.read_text(), str(rename), "exec"), {"__name__": "__main__"})

    if fly.exists():
        import_fbx(fly)
        print("Imported", fly.name, "(reference armature — delete before final export)")

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    print("Saved", BLEND)


if __name__ == "__main__":
    main()
