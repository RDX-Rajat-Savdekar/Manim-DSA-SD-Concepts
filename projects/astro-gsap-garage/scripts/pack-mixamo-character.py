"""
Build Iron Man runtime assets from Mixamo *With Skin* FBXs (same character session).

Usage:
  Blender --background --python scripts/pack-mixamo-character.py -- \
    public/models/iron-man-rigged.glb \
    public/models/mixamo-anims.glb \
    skin_fbx \
    public/models/_src/mixamo
"""
from __future__ import annotations

import os
import re
import sys

import bpy

argv = sys.argv
argv = argv[argv.index("--") + 1 :] if "--" in argv else []
MODEL_OUT = os.path.abspath(argv[0] if argv else "public/models/iron-man-rigged.glb")
ANIM_OUT = os.path.abspath(argv[1] if len(argv) > 1 else "public/models/mixamo-anims.glb")
SKIN_DIR = os.path.abspath(argv[2] if len(argv) > 2 else "skin_fbx")
EXTRA_DIR = os.path.abspath(argv[3] if len(argv) > 3 else "public/models/_src/mixamo")

# Explicit canonical names for known Mixamo titles
NAME_MAP = {
    "orc idle": "idle",
    "breathing idle": "idle",
    "idle": "idle",
    "looking around": "look",
    "fight idle": "fight",
    "fighting idle": "fight",
    "pointing": "repulse",
    "flying": "thrust",
    "flying_": "thrust",
    "fireball": "fireball",
    "butterfly twirl": "butterflytwirl",
    "flip kick": "flipkick",
    "low crawl": "lowcrawl",
    "falling": "falling",
    "thoughtful head shake": "look",
    "standing": "standing",
    "quad punch": "quadpunch",
}

# Prefer these as the skinned host (bind pose model)
HOST_PRIORITY = [
    "Orc Idle_skin.fbx",
    "Orc Idle_skin_1.fbx",
    "Breathing Idle With Skin.fbx",
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


def stem_to_clip(filename: str) -> str:
    stem = os.path.splitext(os.path.basename(filename))[0]
    stem = re.sub(r"_skin(_\d+)?$", "", stem, flags=re.I)
    stem = stem.replace("_", " ").strip().lower()
    if stem in NAME_MAP:
        return NAME_MAP[stem]
    # fallback: alnum only
    return re.sub(r"[^a-z0-9]+", "", stem) or "clip"


def list_fbx(folder: str) -> list[str]:
    if not os.path.isdir(folder):
        return []
    return sorted(
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.lower().endswith(".fbx")
    )


def find_host() -> str:
    for name in HOST_PRIORITY:
        path = os.path.join(SKIN_DIR, name)
        if os.path.isfile(path):
            return path
    skins = [p for p in list_fbx(SKIN_DIR) if "_skin" in os.path.basename(p).lower()]
    if skins:
        return skins[0]
    raise SystemExit(f"[pack-mixamo-character] No With-Skin FBX in {SKIN_DIR}")


def export_glb(path: str, *, skins: bool, animations: bool) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_animations=animations,
        export_nla_strips=animations,
        export_force_sampling=True,
        export_anim_single_armature=True,
        export_apply=False,
        export_skins=skins,
        export_morph=False,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
    )


def capture_action(path: str, collected: dict[str, bpy.types.Action]) -> None:
    clip_name = stem_to_clip(path)
    # Prefer first idle host; allow unique fancy names; skip duplicate idle from skin_1
    if clip_name in collected and clip_name == "idle":
        print(f"[pack-mixamo-character] skip duplicate idle from {os.path.basename(path)}")
        return

    before = set(bpy.data.objects)
    import_fbx(path)
    new_objs = set(bpy.data.objects) - before
    arm = next((o for o in new_objs if o.type == "ARMATURE"), None)
    if not arm or not arm.animation_data or not arm.animation_data.action:
        print(f"[pack-mixamo-character] WARN no action in {path}")
        for o in list(new_objs):
            bpy.data.objects.remove(o, do_unlink=True)
        return

    action = arm.animation_data.action
    # uniquify if needed
    name = clip_name
    n = 2
    while name in collected:
        name = f"{clip_name}{n}"
        n += 1
    action.name = name
    action.use_fake_user = True
    collected[name] = action
    arm.animation_data.action = None
    print(f"[pack-mixamo-character] captured {name} <- {os.path.basename(path)}")
    for o in list(new_objs):
        bpy.data.objects.remove(o, do_unlink=True)


def main() -> None:
    host_path = find_host()
    print(f"[pack-mixamo-character] host {host_path}")

    # --- Model GLB ---
    clear_scene()
    import_fbx(host_path)
    arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if not arms:
        raise SystemExit("[pack-mixamo-character] host has no armature")
    if not meshes:
        raise SystemExit("[pack-mixamo-character] host has no mesh — need With Skin FBX")

    for arm in arms:
        if arm.animation_data:
            arm.animation_data.action = None
            while arm.animation_data.nla_tracks:
                arm.animation_data.nla_tracks.remove(arm.animation_data.nla_tracks[0])
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)

    export_glb(MODEL_OUT, skins=True, animations=False)
    print(f"[pack-mixamo-character] wrote model {MODEL_OUT} ({len(meshes)} meshes)")

    # --- Animation pack: all skin_fbx + useful extras from _src/mixamo ---
    clear_scene()
    collected: dict[str, bpy.types.Action] = {}

    for path in list_fbx(SKIN_DIR):
        capture_action(path, collected)

    # Fill gaps from without-skin folder (same Mixamo character)
    want_extras = {
        "Looking Around.fbx": "look",
        "Fight Idle.fbx": "fight",
        "Breathing Idle.fbx": "idle",
        "Falling.fbx": "falling",
    }
    for filename, clip in want_extras.items():
        if clip in collected:
            continue
        path = os.path.join(EXTRA_DIR, filename)
        if os.path.isfile(path):
            capture_action(path, collected)

    if not collected:
        raise SystemExit("[pack-mixamo-character] no clips collected")

    # Skeleton host for NLA export
    first_skin = list_fbx(SKIN_DIR)[0]
    import_fbx(first_skin)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    arm.name = "mixamo_host"
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = None
    keep = set(collected.values())
    for action in list(bpy.data.actions):
        if action not in keep:
            bpy.data.actions.remove(action)
    while arm.animation_data.nla_tracks:
        arm.animation_data.nla_tracks.remove(arm.animation_data.nla_tracks[0])
    for clip_name, action in collected.items():
        track = arm.animation_data.nla_tracks.new()
        track.name = clip_name
        track.strips.new(clip_name, int(action.frame_range[0]), action)

    export_glb(ANIM_OUT, skins=False, animations=True)
    print(f"[pack-mixamo-character] wrote anims {ANIM_OUT}: {', '.join(collected)}")


if __name__ == "__main__":
    main()
