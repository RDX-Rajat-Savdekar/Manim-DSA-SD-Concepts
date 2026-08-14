#!/usr/bin/env node
/**
 * Phase D — offline assembly frame renderer (Apple-style image sequence).
 *
 * Usage:
 *   node scripts/render-assembly-frames.mjs f1-amr23
 *   node scripts/render-assembly-frames.mjs iron-man
 *
 * Requires: Chrome/Edge for browser capture (recommended), or Node 22 + canvas + gl
 *
 * Browser capture (works on Mac ARM — no native build):
 *   npm run dev
 *   open http://localhost:4321/capture-sequence?id=f1-amr23
 *   Click "Capture & save to folder" → pick public/sequences/f1-amr23
 *
 * Node fallback (if headless-gl builds on your machine):
 *   npm run render:sequence -- f1-amr23
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "canvas";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const PRESETS = {
  "f1-amr23": {
    model: "public/models/f1-amr23.glb",
    bg: "#0c1018",
    exposure: 1.65,
    look: { azimuth: 40, elevation: 12, zoom: 1.05, tx: 0.22, ty: 0.08, tz: 0, fov: 30 },
    frames: 48,
    width: 1280,
    height: 720,
  },
  "f1-w13": {
    model: "public/models/f1-w13.glb",
    bg: "#0c1018",
    exposure: 1.65,
    look: { azimuth: 40, elevation: 12, zoom: 1.05, tx: 0.22, ty: 0.08, tz: 0, fov: 30 },
    frames: 48,
    width: 1280,
    height: 720,
  },
  "iron-man": {
    model: "public/models/iron-man.glb",
    bg: "#0a0606",
    exposure: 1.75,
    look: { azimuth: 32, elevation: 6, zoom: 1.05, tx: 0.2, ty: 0.05, tz: 0, fov: 30 },
    frames: 48,
    width: 1280,
    height: 720,
  },
};

const id = process.argv[2] || "f1-amr23";
const preset = PRESETS[id];
if (!preset) {
  console.error("Unknown preset. Use:", Object.keys(PRESETS).join(", "));
  process.exit(1);
}

const modelPath = path.join(ROOT, preset.model);
if (!existsSync(modelPath)) {
  console.error("Model not found:", modelPath);
  console.error("Restore models per public/models/README.md");
  process.exit(1);
}

const outDir = path.join(ROOT, "public/sequences", id);
await mkdir(outDir, { recursive: true });

let createGL;
try {
  createGL = (await import("gl")).default;
} catch {
  console.error(`
Headless WebGL unavailable on this machine.
Use browser capture instead:
  npm run dev
  open http://localhost:4321/capture-sequence?id=${id}
`);
  process.exit(1);
}

const gl = createGL(preset.width, preset.height, { preserveDrawingBuffer: true });
const canvas2d = createCanvas(preset.width, preset.height);
const canvas = {
  width: preset.width,
  height: preset.height,
  clientWidth: preset.width,
  clientHeight: preset.height,
  style: {},
  getContext(type) {
    if (type === "webgl" || type === "webgl2") return gl;
    return canvas2d.getContext(type);
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: false });
renderer.setSize(preset.width, preset.height, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = preset.exposure;

const scene = new THREE.Scene();
scene.background = new THREE.Color(preset.bg);

const camera = new THREE.PerspectiveCamera(preset.look.fov, preset.width / preset.height, 0.05, 200);

scene.add(new THREE.AmbientLight(0xffffff, 1.1));
scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 3.2);
key.position.set(5, 8, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0x7cffc4, 1.8);
fill.position.set(-4, 2, -3);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xff2d55, 1.4);
rim.position.set(-2, 3, 6);
scene.add(rim);

const pivot = new THREE.Group();
scene.add(pivot);

function fitModel(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  object.scale.setScalar(1.85 / maxDim);
  object.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(object);
  object.position.sub(scaled.getCenter(new THREE.Vector3()));
  object.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(object);
  object.position.y -= fitted.getCenter(new THREE.Vector3()).y;
  object.position.y += 0.02;
  return fitted.getSize(new THREE.Vector3());
}

function buildExplodeParts(model, modelSize) {
  const parts = [];
  const meshes = [];
  model.traverse((c) => c.isMesh && meshes.push(c));
  if (meshes.length < 2) return parts;

  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  const world = new THREE.Vector3();
  const scale = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.14;

  meshes.forEach((mesh, i) => {
    const base = mesh.position.clone();
    mesh.getWorldPosition(world);
    const dir = world.sub(center);
    if (dir.lengthSq() < 1e-6) {
      const a = (i / meshes.length) * Math.PI * 2;
      dir.set(Math.cos(a), Math.sin(a * 0.7), Math.sin(a));
    }
    dir.normalize();
    parts.push({ mesh, base, dir, dist: scale * (0.7 + (i % 5) * 0.08) });
  });
  return parts;
}

function applyExplode(parts, t) {
  const q = new THREE.Quaternion();
  const off = new THREE.Vector3();
  for (const p of parts) {
    off.copy(p.dir).multiplyScalar(t * p.dist);
    if (p.mesh.parent) {
      p.mesh.parent.getWorldQuaternion(q).invert();
      off.applyQuaternion(q);
    }
    p.mesh.position.copy(p.base).add(off);
  }
}

function applyCamera(modelSize, look) {
  const focus = new THREE.Vector3(
    look.tx * modelSize.x,
    look.ty * modelSize.y,
    look.tz * modelSize.z
  );
  const fovRad = THREE.MathUtils.degToRad(look.fov);
  const radius = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.5 || 0.9;
  const dist = THREE.MathUtils.clamp((radius * 1.4) / Math.tan(fovRad / 2), 2.2, 7.5) * look.zoom;
  const az = THREE.MathUtils.degToRad(look.azimuth);
  const el = THREE.MathUtils.degToRad(look.elevation);
  camera.position.set(
    focus.x + Math.cos(el) * Math.sin(az) * dist,
    focus.y + Math.sin(el) * dist,
    focus.z + Math.cos(el) * Math.cos(az) * dist
  );
  camera.fov = look.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(focus);
}

const loader = new GLTFLoader();
const gltf = await loader.loadAsync(`file://${modelPath}`);
let modelSize = fitModel(gltf.scene);
const explodeParts = buildExplodeParts(gltf.scene, modelSize);
pivot.add(gltf.scene);

gltf.scene.traverse((child) => {
  if (!child.isMesh) return;
  const mats = Array.isArray(child.material) ? child.material : [child.material];
  mats.forEach((mat) => {
    if (!mat) return;
    mat.side = THREE.DoubleSide;
    if ("envMapIntensity" in mat) mat.envMapIntensity = 1.6;
    mat.needsUpdate = true;
  });
});

console.log(`Rendering ${preset.frames} frames → ${outDir}`);

for (let i = 0; i < preset.frames; i++) {
  const t = 1 - i / (preset.frames - 1);
  applyExplode(explodeParts, t);
  applyCamera(modelSize, preset.look);
  pivot.rotation.y = 0.15 * (1 - t);
  renderer.render(scene, camera);

  const pixels = new Uint8Array(preset.width * preset.height * 4);
  gl.readPixels(0, 0, preset.width, preset.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  // Flip Y for canvas
  const row = preset.width * 4;
  const flipped = Buffer.alloc(row * preset.height);
  for (let y = 0; y < preset.height; y++) {
    pixels
      .slice((preset.height - 1 - y) * row, (preset.height - y) * row)
      .copy(flipped, y * row);
  }
  const ctx = canvas2d.getContext("2d");
  const imgData = ctx.createImageData(preset.width, preset.height);
  imgData.data.set(flipped);
  ctx.putImageData(imgData, 0, 0);

  const buf = canvas2d.toBuffer("image/webp", { quality: 0.88 });
  const name = `${String(i + 1).padStart(4, "0")}.webp`;
  await writeFile(path.join(outDir, name), buf);
  process.stdout.write(`\r  ${i + 1}/${preset.frames}`);
}

const manifest = {
  id,
  frameCount: preset.frames,
  ext: "webp",
  pad: 4,
  prefix: "",
  width: preset.width,
  height: preset.height,
  assembly: { from: 1, to: 0, description: "Scroll scrubs exploded → assembled" },
};
await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log("\nDone. manifest.json written.");
