#!/usr/bin/env node
/**
 * Retarget Mixamo clips onto Iron Man (or any Mixamo-named skeleton) and merge.
 *
 * Usage:
 *   node scripts/merge-mixamo-anims.mjs \
 *     --target public/models/iron-man-rigged.glb \
 *     --out public/models/iron-man-rigged.glb \
 *     --anims public/models/_src/mixamo/Xbot.glb
 *
 *   # Or drop FBX/GLB (Without Skin) into public/models/_src/mixamo/ and:
 *   npm run mixamo:merge
 *
 * Bone remap: mixamorig:Hips / mixamorigHips  →  mixamorigHips_01  (Sketchfab suffix)
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

globalThis.self = globalThis;

const ROOT = process.cwd();
const DEFAULT_TARGET = "public/models/iron-man-rigged.glb";
const DEFAULT_OUT = "public/models/iron-man-rigged.glb";
const DEFAULT_ANIM_DIR = "public/models/_src/mixamo";

function parseArgs(argv) {
  const out = { target: DEFAULT_TARGET, out: DEFAULT_OUT, anims: [], inplace: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--anims") out.anims.push(argv[++i]);
    else if (a === "--no-inplace") out.inplace = false;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function boneKey(name) {
  return String(name || "")
    .replace(/^mixamorig[:_]?/i, "")
    .replace(/_\d+$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function collectBones(root) {
  /** @type {Map<string, string>} key → actual bone name on target */
  const map = new Map();
  root.traverse((o) => {
    if (!o.isBone) return;
    const key = boneKey(o.name);
    if (key && !map.has(key)) map.set(key, o.name);
  });
  return map;
}

function remapTrackName(trackName, boneMap) {
  // "mixamorigHips.quaternion" | "mixamorig:Hips.position" | "Armature|mixamorigHips.quaternion"
  const cleaned = trackName.replace(/^.*\|/, "");
  const dot = cleaned.lastIndexOf(".");
  if (dot < 0) return null;
  const bonePart = cleaned.slice(0, dot);
  const prop = cleaned.slice(dot + 1);
  const key = boneKey(bonePart.replace(/^mixamorig[:_]?/i, "mixamorig"));
  // boneKey already strips mixamorig — recompute from raw bone part
  const k = boneKey(bonePart);
  const targetBone = boneMap.get(k);
  if (!targetBone) return null;
  return `${targetBone}.${prop}`;
}

/**
 * Retarget a clip onto target bone names. Optionally freeze root translation (in-place).
 */
export function retargetClip(clip, boneMap, { inplace = true, rename = null } = {}) {
  const tracks = [];
  for (const track of clip.tracks) {
    const nextName = remapTrackName(track.name, boneMap);
    if (!nextName) continue;
    const cloned = track.clone();
    cloned.name = nextName;
    if (inplace && /\.position$/i.test(nextName) && /hips/i.test(nextName)) {
      // Keep Y bob; zero XZ root motion so the suit stays framed
      const arr = cloned.values;
      const stride = 3;
      for (let i = 0; i < arr.length; i += stride) {
        arr[i] = 0;
        arr[i + 2] = 0;
      }
    }
    tracks.push(cloned);
  }
  if (!tracks.length) return null;
  const name = rename || clip.name || "clip";
  return new THREE.AnimationClip(name, clip.duration, tracks);
}

async function loadGltf(abs) {
  const buffer = fs.readFileSync(abs);
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  await Promise.resolve(MeshoptDecoder.ready).catch(() => {});
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      "",
      resolve,
      reject
    );
  });
}

async function loadFbx(abs) {
  const buffer = fs.readFileSync(abs);
  const loader = new FBXLoader();
  return loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "");
}

async function loadAnimsFromFile(abs) {
  const ext = path.extname(abs).toLowerCase();
  if (ext === ".glb" || ext === ".gltf") {
    const gltf = await loadGltf(abs);
    return gltf.animations || [];
  }
  if (ext === ".fbx") {
    const group = await loadFbx(abs);
    const clips = group.animations || [];
    // Name from filename if Mixamo left it generic
    const base = path.basename(abs, ext).replace(/[_\s]+/g, " ").trim();
    return clips.map((c, i) => {
      const n = !c.name || /^mixamo\.com$/i.test(c.name) || c.name === "Take 001"
        ? base || `clip_${i}`
        : c.name;
      c.name = n;
      return c;
    });
  }
  return [];
}

function discoverAnimFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(glb|gltf|fbx)$/i.test(f))
    .map((f) => path.join(dir, f));
}

function exportGlb(scene, animations) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(Buffer.from(result));
        else reject(new Error("Expected binary GLB export"));
      },
      reject,
      { binary: true, animations }
    );
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/merge-mixamo-anims.mjs [--target glb] [--out glb] [--anims file ...] [--no-inplace]`);
    process.exit(0);
  }

  const targetAbs = path.resolve(ROOT, args.target);
  const outAbs = path.resolve(ROOT, args.out);
  if (!fs.existsSync(targetAbs)) {
    console.error("Missing target model:", targetAbs);
    process.exit(1);
  }

  let animFiles = args.anims.map((f) => path.resolve(ROOT, f));
  if (!animFiles.length) {
    animFiles = discoverAnimFiles(path.resolve(ROOT, DEFAULT_ANIM_DIR));
  }
  if (!animFiles.length) {
    console.error(
      `No animation files. Drop Mixamo FBX/GLB (Without Skin) into ${DEFAULT_ANIM_DIR}/ or pass --anims`
    );
    process.exit(1);
  }

  console.log("Target:", path.relative(ROOT, targetAbs));
  const target = await loadGltf(targetAbs);
  const boneMap = collectBones(target.scene);
  console.log("Target bones:", boneMap.size);

  /** Suggested aliases for garage beats */
  const RENAME = {
    idle: "idle",
    breathingidle: "idle",
    standingidle: "idle",
    agree: "agree",
    pointing: "repulse",
    point: "repulse",
    standingpointing: "repulse",
    standingusingtouchscreen: "repulse",
    fistidle: "idle",
    flying: "thrust",
    hover: "thrust",
    standing: "idle",
  };

  const merged = [...(target.animations || [])];
  const seen = new Set(merged.map((c) => c.name.toLowerCase()));

  for (const file of animFiles) {
    console.log("Anims from:", path.relative(ROOT, file));
    const clips = await loadAnimsFromFile(file);
    for (const clip of clips) {
      const rawKey = boneKey(clip.name).replace(/[^a-z0-9]/g, "");
      const alias = RENAME[rawKey] || clip.name;
      const retargeted = retargetClip(clip, boneMap, {
        inplace: args.inplace,
        rename: alias,
      });
      if (!retargeted) {
        console.warn("  skip (no matching tracks):", clip.name);
        continue;
      }
      const key = retargeted.name.toLowerCase();
      // Replace existing same-name clip
      const idx = merged.findIndex((c) => c.name.toLowerCase() === key);
      if (idx >= 0) merged[idx] = retargeted;
      else merged.push(retargeted);
      seen.add(key);
      console.log(
        `  + ${clip.name} → ${retargeted.name} (${retargeted.tracks.length} tracks, ${retargeted.duration.toFixed(2)}s)`
      );
    }
  }

  if (!merged.length) {
    console.error("No clips retargeted. Check bone names.");
    process.exit(1);
  }

  const buffer = await exportGlb(target.scene, merged);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, buffer);
  console.log(`Wrote ${path.relative(ROOT, outAbs)} (${(buffer.length / 1e6).toFixed(2)} MB, ${merged.length} clips)`);
  console.log("Clips:", merged.map((c) => c.name).join(", "));
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
