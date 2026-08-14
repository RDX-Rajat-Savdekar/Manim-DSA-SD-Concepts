"""
Pack Mixamo Without-Skin FBX clips into a single animation GLB for Three.js.

Usage:
  Blender --background --python scripts/pack-mixamo-anims.py -- \
    public/models/mixamo-anims.glb public/models/_src/mixamo
"""
from __future__ import annotations

import os
import sys

import bpy

argv = sys.argv
argv = argv[argv.index("--") + 1 :] if "--" in argv else []
OUT_PATH = os.path.abspath(argv[0] if argv else "public/models/mixamo-anims.glb")
SRC_DIR = os.path.abspath(argv[1] if len(argv) > 1 else "public/models/_src/mixamo")

# filename → canonical clip name used by BEAT_FX / aliasClipName
CLIPS = [
    ("Breathing Idle.fbx", "idle"),
    ("Looking Around.fbx", "look"),
    ("Fight Idle.fbx", "fight"),
    ("Pointing.fbx", "repulse"),
    ("Flying_.fbx", "thrust"),
    ("Fireball.fbx", "fireball"),
]


def purge_orphans() -> None:
    for block in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials, bpy.data.images):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    purge_orphans()


def import_fbx(path: str) -> None:
    bpy.ops.import_scene.fbx(
        filepath=path,
        ignore_leaf_bones=True,
        automatic_bone_orientation=False,
        use_anim=True,
    )


def main() -> None:
    clear_scene()
    collected: dict[str, bpy.types.Action] = {}

    for filename, clip_name in CLIPS:
        path = os.path.join(SRC_DIR, filename)
        if not os.path.isfile(path):
            print(f"[pack-mixamo] SKIP missing {path}")
            continue

        before = set(bpy.data.objects)
        import_fbx(path)
        new_objs = set(bpy.data.objects) - before
        arm = next((o for o in new_objs if o.type == "ARMATURE"), None)
        if not arm or not arm.animation_data or not arm.animation_data.action:
            print(f"[pack-mixamo] WARN no action in {filename}")
            for o in list(new_objs):
                bpy.data.objects.remove(o, do_unlink=True)
            continue

        action = arm.animation_data.action
        action.name = clip_name
        action.use_fake_user = True
        collected[clip_name] = action
        arm.animation_data.action = None
        fr = tuple(action.frame_range)
        print(f"[pack-mixamo] captured {clip_name} from {filename} frames {fr}")

        for o in list(new_objs):
            bpy.data.objects.remove(o, do_unlink=True)

    if not collected:
        raise SystemExit("[pack-mixamo] no clips collected")

    # Host armature from the first available source file
    host_file = next(f for f, n in CLIPS if n in collected)
    import_fbx(os.path.join(SRC_DIR, host_file))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    arm.name = "mixamo_host"

    # Drop meshes — animation pack only
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)

    if not arm.animation_data:
        arm.animation_data_create()
    # Detach host import action so glTF does not emit a duplicate Layer0 clip
    arm.animation_data.action = None

    # Remove any leftover actions that are not in our collected set
    keep = set(collected.values())
    for action in list(bpy.data.actions):
        if action not in keep:
            bpy.data.actions.remove(action)

    # Clear existing NLA tracks
    while arm.animation_data.nla_tracks:
        arm.animation_data.nla_tracks.remove(arm.animation_data.nla_tracks[0])

    for clip_name, action in collected.items():
        track = arm.animation_data.nla_tracks.new()
        track.name = clip_name
        start = int(action.frame_range[0])
        track.strips.new(clip_name, start, action)
        print(f"[pack-mixamo] NLA track {clip_name} frames {action.frame_range[:]}")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format="GLB",
        export_animations=True,
        export_nla_strips=True,
        export_force_sampling=True,
        export_anim_single_armature=True,
        export_apply=False,
        export_skins=False,
        export_morph=False,
    )
    print(f"[pack-mixamo] wrote {OUT_PATH} with {len(collected)} clips: {', '.join(collected)}")


if __name__ == "__main__":
    main()
