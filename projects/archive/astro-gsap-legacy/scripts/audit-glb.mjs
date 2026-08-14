#!/usr/bin/env node
/**
 * Audit a GLB: meshes, bones, skins, animations.
 * Usage: node scripts/audit-glb.mjs public/models/f1-w13.glb
 */
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// Three.js GLTFLoader expects browser globals in Node
globalThis.self = globalThis;
globalThis.URL = URL;
globalThis.Blob = Blob;

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/audit-glb.mjs <path-to.glb>");
  process.exit(1);
}

const abs = path.resolve(file);
if (!fs.existsSync(abs)) {
  console.error("Missing file:", abs);
  process.exit(1);
}

const buffer = fs.readFileSync(abs);
const draco = new DRACOLoader();
draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
loader.setMeshoptDecoder(MeshoptDecoder);

await Promise.resolve(MeshoptDecoder.ready).catch(() => {});

const gltf = await new Promise((resolve, reject) => {
  loader.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    "",
    resolve,
    reject
  );
});

const meshes = [];
const bones = [];
const skinned = [];
gltf.scene.traverse((o) => {
  if (o.isMesh) {
    meshes.push({
      name: o.name || "(unnamed)",
      verts: o.geometry?.attributes?.position?.count ?? 0,
      skinned: !!o.isSkinnedMesh,
    });
  }
  if (o.isBone) bones.push(o.name || "(bone)");
  if (o.isSkinnedMesh) skinned.push(o.name || "(skinned)");
});

const wheelish = meshes.filter((m) => /(wheel|tyre|tire|rim|hub)/i.test(m.name));

const clips = (gltf.animations || []).map((c) => ({
  name: c.name,
  duration: Number(c.duration.toFixed(3)),
  tracks: c.tracks.length,
}));

const report = {
  file: path.relative(process.cwd(), abs),
  bytes: buffer.length,
  meshCount: meshes.length,
  boneCount: bones.length,
  skinnedCount: skinned.length,
  animationCount: clips.length,
  wheelCandidates: wheelish.map((m) => m.name),
  bones: bones.slice(0, 60),
  clips,
  meshes: meshes.map((m) => `${m.name}${m.skinned ? " [skinned]" : ""}`),
};

console.log(JSON.stringify(report, null, 2));
