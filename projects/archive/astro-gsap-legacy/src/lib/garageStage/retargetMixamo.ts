/**
 * Retarget Mixamo AnimationClips onto Sketchfab-style bones.
 *
 * Modes:
 * - naive: copy remapped quaternions (breaks when rest poses differ)
 * - restRelative: q_out = q_targetBind * inv(q_sourceBind) * q_source
 */
import * as THREE from "three";

/** Normalize a bone name to a comparable key. */
export function boneKey(name: string): string {
  return String(name || "")
    .replace(/^mixamorig[:_]?/i, "")
    .replace(/_\d+$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

/** Collect bone name → actual name map from a skeleton root. */
export function collectBoneMap(root: THREE.Object3D): Map<string, string> {
  const map = new Map<string, string>();
  root.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    const key = boneKey(o.name);
    if (key && !map.has(key)) map.set(key, o.name);
  });
  return map;
}

/** Collect bone key → local bind quaternion map. */
export function collectBindQuats(root: THREE.Object3D): Map<string, THREE.Quaternion> {
  root.updateMatrixWorld(true);
  const map = new Map<string, THREE.Quaternion>();
  root.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    const key = boneKey(o.name);
    if (key && !map.has(key)) map.set(key, o.quaternion.clone());
  });
  return map;
}

/** Known Mixamo clip name → canonical pose name aliases. */
export const MIXAMO_CLIP_ALIASES: Record<string, string> = {
  idle: "idle",
  breathingidle: "idle",
  standingidle: "idle",
  standing: "idle",
  agree: "repulse",
  pointing: "repulse",
  point: "repulse",
  standingpointing: "repulse",
  standingusingtouchscreen: "repulse",
  waving: "repulse",
  wave: "repulse",
  flying: "thrust",
  hover: "thrust",
  fallingidle: "thrust",
  headshake: "look",
  thoughtfulheadshake: "look",
  lookingaround: "look",
};

const CANONICAL = new Set(["idle", "look", "repulse", "thrust", "still", "falling", "walk", "run"]);

/** Map a raw clip name to a canonical pose name. */
export function aliasClipName(name: string): string {
  const key = boneKey(name);
  if (CANONICAL.has(key)) return key;
  return MIXAMO_CLIP_ALIASES[key] || name;
}

function remapTrackName(trackName: string, boneMap: Map<string, string>): string | null {
  const cleaned = trackName.replace(/^.*\|/, "");
  const dot = cleaned.lastIndexOf(".");
  if (dot < 0) return null;
  const bonePart = cleaned.slice(0, dot);
  const prop = cleaned.slice(dot + 1);
  const targetBone = boneMap.get(boneKey(bonePart));
  if (!targetBone) return null;
  return `${targetBone}.${prop}`;
}

interface RetargetClipOpts {
  inplace?: boolean;
  rename?: string | null;
  rotationsOnly?: boolean;
  mode?: "naive" | "restRelative";
  sourceBind?: Map<string, THREE.Quaternion> | null;
  targetBind?: Map<string, THREE.Quaternion> | null;
}

/** Retarget a single clip from source skeleton to target skeleton. */
export function retargetClip(
  clip: THREE.AnimationClip,
  boneMap: Map<string, string>,
  opts: RetargetClipOpts = {},
): THREE.AnimationClip | null {
  const {
    inplace = true,
    rename = null,
    rotationsOnly = true,
    mode = "restRelative",
    sourceBind = null,
    targetBind = null,
  } = opts;

  const tracks: THREE.KeyframeTrack[] = [];
  const _src = new THREE.Quaternion();
  const _inv = new THREE.Quaternion();
  const _out = new THREE.Quaternion();

  for (const track of clip.tracks) {
    const nextName = remapTrackName(track.name, boneMap);
    if (!nextName) continue;

    if (/\.scale$/i.test(nextName)) continue;
    if (/\.position$/i.test(nextName)) {
      if (rotationsOnly) continue;
      if (!inplace || !/hips/i.test(nextName)) continue;
    }

    const cloned = track.clone();
    cloned.name = nextName;

    if (/\.quaternion$/i.test(nextName) && mode === "restRelative" && sourceBind && targetBind) {
      const key = boneKey(nextName.slice(0, nextName.lastIndexOf(".")));
      const qSrcBind = sourceBind.get(key);
      const qTgtBind = targetBind.get(key);
      if (qSrcBind && qTgtBind && cloned.values?.length >= 4) {
        const arr = cloned.values;
        for (let i = 0; i < arr.length; i += 4) {
          _src.set(arr[i], arr[i + 1], arr[i + 2], arr[i + 3]).normalize();
          _inv.copy(qSrcBind).invert();
          _out.copy(qTgtBind).multiply(_inv).multiply(_src).normalize();
          arr[i] = _out.x;
          arr[i + 1] = _out.y;
          arr[i + 2] = _out.z;
          arr[i + 3] = _out.w;
        }
      }
    }

    if (inplace && /\.position$/i.test(nextName) && /hips/i.test(nextName)) {
      const arr = cloned.values;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = 0;
        arr[i + 2] = 0;
      }
    }
    tracks.push(cloned);
  }
  if (!tracks.length) return null;
  return new THREE.AnimationClip(rename || clip.name || "clip", clip.duration, tracks);
}

interface RetargetClipsOpts {
  inplace?: boolean;
  rotationsOnly?: boolean;
  mode?: "naive" | "restRelative";
  sourceRoot?: THREE.Object3D | null;
}

/** Retarget a batch of clips from source to target skeleton. */
export function retargetClipsToRoot(
  targetRoot: THREE.Object3D,
  sourceClips: THREE.AnimationClip[],
  opts: RetargetClipsOpts = {},
): THREE.AnimationClip[] {
  const { inplace = true, rotationsOnly = true, mode = "restRelative", sourceRoot = null } = opts;

  const boneMap = collectBoneMap(targetRoot);
  const targetBind = collectBindQuats(targetRoot);
  const sourceBind = sourceRoot ? collectBindQuats(sourceRoot) : null;

  const effectiveMode = mode === "restRelative" && sourceBind?.size ? "restRelative" : "naive";

  const byName = new Map<string, THREE.AnimationClip>();
  for (const clip of sourceClips || []) {
    const rename = aliasClipName(clip.name);
    const next = retargetClip(clip, boneMap, {
      inplace,
      rename,
      rotationsOnly,
      mode: effectiveMode,
      sourceBind,
      targetBind,
    });
    if (next) byName.set(next.name.toLowerCase(), next);
  }
  return Array.from(byName.values());
}
