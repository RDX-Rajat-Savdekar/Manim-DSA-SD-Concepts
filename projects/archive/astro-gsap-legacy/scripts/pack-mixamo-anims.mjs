#!/usr/bin/env node
/**
 * Pack Mixamo FBX/GLB clips into public/models/mixamo-anims.glb
 * (animation + light skeleton only — Iron Man retargets at runtime).
 *
 *   npm run mixamo:pack
 *
 * Drops: public/models/_src/mixamo/*.{fbx,glb}
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

globalThis.self = globalThis;

/** Node polyfill — GLTFExporter reads textures via FileReader */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    result = null;
    onload = null;
    onloadend = null;
    onerror = null;
    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer())
        .then((buf) => {
          this.result = buf;
          this.onload?.({ target: this });
          this.onloadend?.({ target: this });
        })
        .catch((err) => this.onerror?.({ target: this, error: err }));
    }
    readAsDataURL(blob) {
      Promise.resolve(blob.arrayBuffer())
        .then((buf) => {
          this.result = `data:application/octet-stream;base64,${Buffer.from(buf).toString("base64")}`;
          this.onload?.({ target: this });
          this.onloadend?.({ target: this });
        })
        .catch((err) => this.onerror?.({ target: this, error: err }));
    }
  };
}

const ROOT = process.cwd();
const ANIM_DIR = path.join(ROOT, "public/models/_src/mixamo");
const OUT = path.join(ROOT, "public/models/mixamo-anims.glb");

/** Filename stem → garage clip alias */
const NAME_MAP = {
  idle: "idle",
  flying: "thrust",
  falling: "falling",
  fallingidle: "thrust",
  "thoughtful head shake": "look",
  thoughtfulheadshake: "look",
  headshake: "look",
  lookingaround: "look",
  pointing: "repulse",
  point: "repulse",
  agree: "repulse",
  waving: "repulse",
  walk: "walk",
  run: "run",
};

function stemName(file) {
  return path.basename(file, path.extname(file)).replace(/[_\-]+/g, " ").trim();
}

function aliasFromFile(file) {
  const stem = stemName(file).toLowerCase();
  const compact = stem.replace(/[^a-z0-9]/g, "");
  return NAME_MAP[stem] || NAME_MAP[compact] || stem.replace(/\s+/g, "_");
}

async function loadGltf(abs) {
  const buffer = fs.readFileSync(abs);
  const loader = new GLTFLoader();
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

function loadFbx(abs) {
  const buffer = fs.readFileSync(abs);
  const loader = new FBXLoader();
  return loader.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    ""
  );
}

function stripMeshes(root) {
  const remove = [];
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) remove.push(o);
  });
  remove.forEach((o) => o.parent?.remove(o));
}

function exportGlb(scene, animations) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(Buffer.from(result));
        else reject(new Error("Expected binary GLB"));
      },
      reject,
      { binary: true, animations, onlyVisible: false }
    );
  });
}

async function main() {
  if (!fs.existsSync(ANIM_DIR)) {
    console.error("Missing", ANIM_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(ANIM_DIR)
    .filter((f) => /\.(fbx|glb|gltf)$/i.test(f))
    .map((f) => path.join(ANIM_DIR, f))
    // Prefer Xbot (has real skin) as export skeleton so bones survive GLTFExporter
    .sort((a, b) => {
      const ax = /xbot/i.test(a) ? 0 : 1;
      const bx = /xbot/i.test(b) ? 0 : 1;
      return ax - bx || a.localeCompare(b);
    });

  if (!files.length) {
    console.error("No FBX/GLB in", ANIM_DIR);
    process.exit(1);
  }

  /** @type {THREE.AnimationClip[]} */
  const clips = [];
  /** @type {THREE.Object3D | null} */
  let skeletonRoot = null;
  const seen = new Set();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const alias = aliasFromFile(file);
    let anims = [];
    let scene = null;

    if (ext === ".fbx") {
      const group = loadFbx(file);
      scene = group;
      anims = group.animations || [];
    } else {
      // Prefer idle (and agree→repulse) from Xbot; skip other Xbot clutter if FBX present
      const gltf = await loadGltf(file);
      scene = gltf.scene;
      anims = (gltf.animations || []).filter((c) => {
        const n = c.name.toLowerCase();
        // Keep useful Xbot clips only
        return ["idle", "agree", "headshake"].includes(n) || path.basename(file).toLowerCase() !== "xbot.glb";
      });
    }

    if (!skeletonRoot && scene) {
      skeletonRoot = scene;
      // Keep Xbot skin so bones export; strip only for pure FBX skeletons
      if (!/xbot/i.test(file)) {
        stripMeshes(skeletonRoot);
      }
    }

    for (const clip of anims) {
      let name = alias;
      // Xbot multi-clip file: use clip's own name mapped
      if (path.basename(file).toLowerCase() === "xbot.glb") {
        const n = clip.name.toLowerCase();
        name = NAME_MAP[n] || clip.name;
      }
      const key = name.toLowerCase();
      if (seen.has(key) && path.basename(file).toLowerCase() === "xbot.glb") {
        // FBX wins over Xbot for same alias
        continue;
      }
      const cloned = clip.clone();
      cloned.name = name;
      // Zero XZ root motion for framing
      for (const track of cloned.tracks) {
        if (/\.position$/i.test(track.name) && /hips/i.test(track.name)) {
          const arr = track.values;
          for (let i = 0; i < arr.length; i += 3) {
            arr[i] = 0;
            arr[i + 2] = 0;
          }
        }
      }
      if (seen.has(key)) {
        const idx = clips.findIndex((c) => c.name.toLowerCase() === key);
        if (idx >= 0) clips[idx] = cloned;
      } else {
        clips.push(cloned);
        seen.add(key);
      }
      console.log(`+ ${path.basename(file)} :: ${clip.name} → ${name} (${cloned.duration.toFixed(2)}s, ${cloned.tracks.length} tracks)`);
    }
  }

  if (!skeletonRoot) {
    console.error("No skeleton root");
    process.exit(1);
  }
  if (!clips.length) {
    console.error("No clips packed");
    process.exit(1);
  }

  // Bind animations to exporter via scene.animations
  skeletonRoot.updateMatrixWorld(true);
  const buffer = await exportGlb(skeletonRoot, clips);
  fs.writeFileSync(OUT, buffer);
  console.log(`\nWrote ${path.relative(ROOT, OUT)} (${(buffer.length / 1e6).toFixed(2)} MB)`);
  console.log("Clips:", clips.map((c) => c.name).join(", "));
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
