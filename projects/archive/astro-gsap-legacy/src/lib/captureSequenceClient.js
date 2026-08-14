import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const PRESETS = {
  "f1-amr23": {
    model: "/models/f1-amr23.glb",
    bg: "#0a1018",
    exposure: 2.55,
    hdri: "/hdri/skylit_garage_2k.hdr",
    bgIntensity: 0.42,
    envIntensity: 3.4,
    frames: 48,
  },
  "f1-w13": {
    model: "/models/f1-w13.glb",
    bg: "#0a1018",
    exposure: 2.55,
    hdri: "/hdri/skylit_garage_2k.hdr",
    bgIntensity: 0.42,
    envIntensity: 3.4,
    frames: 48,
  },
  "iron-man": {
    model: "/models/iron-man.glb",
    bg: "#120808",
    exposure: 1.22,
    hdri: "/hdri/empty_warehouse_01_2k.hdr",
    bgIntensity: 0.38,
    envIntensity: 0.95,
    frames: 48,
  },
};

export async function initCaptureSequence() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "f1-amr23";
  const auto = params.get("auto") === "1";
  const preset = PRESETS[id];

  const logEl = document.getElementById("log");
  const hint = document.getElementById("hint");
  const runBtn = document.getElementById("run");
  const canvas = document.getElementById("c");
  if (!(canvas instanceof HTMLCanvasElement) || !hint || !runBtn || !logEl) return;

  const log = (m) => {
    logEl.textContent += m + "\n";
  };

  window.__FRAMES = null;
  window.__CAPTURE_DONE = false;
  window.__CAPTURE_ERROR = null;

  if (!preset) {
    hint.textContent = "Unknown id. Use ?id=f1-amr23 | f1-w13 | iron-man";
    window.__CAPTURE_ERROR = "bad id";
    window.__CAPTURE_DONE = true;
    return;
  }

  hint.textContent = `Preset: ${id} · loading model…`;

  const W = 1280;
  const H = 720;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = preset.exposure;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(preset.bg);
  scene.fog = null;

  const isF1 = id.startsWith("f1");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = preset.envIntensity ?? 2.2;

  try {
    const hdr = await new RGBELoader().loadAsync(preset.hdri);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const env = pmrem.fromEquirectangular(hdr).texture;
    scene.environment = env;
    scene.environmentIntensity = preset.envIntensity ?? (isF1 ? 3.4 : 0.95);
    scene.background = env;
    scene.backgroundBlurriness = isF1 ? 0.12 : 0.08;
    scene.backgroundIntensity = preset.bgIntensity ?? (isF1 ? 0.42 : 0.38);
    hdr.dispose();
  } catch {
    log("HDRI skipped — RoomEnvironment fallback");
  }

  scene.add(new THREE.AmbientLight(0xffffff, isF1 ? 1.65 : 0.7));
  scene.add(new THREE.HemisphereLight(0xffffff, isF1 ? 0x3a4555 : 0x444444, isF1 ? 1.45 : 0.8));
  const key = new THREE.DirectionalLight(0xffffff, isF1 ? 4.8 : 2.85);
  key.position.set(4.5, 7.5, 3.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(isF1 ? 0xc8ffe8 : 0x6a80ff, isF1 ? 3.2 : 1.3);
  fill.position.set(-5.5, 2.2, -2.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(isF1 ? 0xff5577 : 0xff2a2a, isF1 ? 3.0 : 1.9);
  rim.position.set(-1.5, 3.5, 5.5);
  scene.add(rim);
  if (isF1) {
    const front = new THREE.DirectionalLight(0xffffff, 3.2);
    front.position.set(0, 2.5, 8);
    scene.add(front);
    const top = new THREE.DirectionalLight(0xffffff, 2.2);
    top.position.set(1, 10, 0);
    scene.add(top);
    const under = new THREE.DirectionalLight(0x9effd4, 1.8);
    under.position.set(0, -2, 2);
    scene.add(under);
  }

  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 200);
  const pivot = new THREE.Group();
  scene.add(pivot);

  log(`Loading ${preset.model}…`);
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  await Promise.resolve(MeshoptDecoder.ready).catch(() => {});
  const gltf = await loader.loadAsync(preset.model);
  const model = gltf.scene;

  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray()) || 1;
  model.scale.setScalar(1.85 / maxDim);
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model);
  model.position.sub(box.getCenter(new THREE.Vector3()));
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.getCenter(new THREE.Vector3()).y;
  model.position.y += 0.02;
  pivot.add(model);

  model.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      if (!mat) return;
      mat.side = THREE.DoubleSide;
      if ("envMapIntensity" in mat) mat.envMapIntensity = isF1 ? 3.05 : 1.45;
      if (isF1 && mat.color) {
        mat.color.r = Math.min(1, mat.color.r * 1.14);
        mat.color.g = Math.min(1, mat.color.g * 1.14);
        mat.color.b = Math.min(1, mat.color.b * 1.14);
      }
      if ("metalness" in mat && mat.metalness > 0.95) mat.metalness = 0.82;
      if ("roughness" in mat && mat.roughness < 0.08) mat.roughness = 0.18;
      mat.needsUpdate = true;
    });
  });

  const modelSize = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const meshes = [];
  model.traverse((c) => c.isMesh && meshes.push(c));
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  const world = new THREE.Vector3();
  const scale = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.14;
  const parts = meshes.map((mesh, i) => {
    const base = mesh.position.clone();
    mesh.getWorldPosition(world);
    const dir = world.clone().sub(center);
    if (dir.lengthSq() < 1e-6) {
      const a = (i / Math.max(1, meshes.length)) * Math.PI * 2;
      dir.set(Math.cos(a), Math.sin(a * 0.7), Math.sin(a));
    }
    dir.normalize();
    return { mesh, base, dir, dist: scale * (0.7 + (i % 5) * 0.08) };
  });

  const look = { az: 40, el: 12, zoom: 1.05, tx: 0.2, ty: 0.08, tz: 0 };

  function renderFrame(explodeT) {
    const q = new THREE.Quaternion();
    const off = new THREE.Vector3();
    parts.forEach((p) => {
      off.copy(p.dir).multiplyScalar(explodeT * p.dist);
      if (p.mesh.parent) {
        p.mesh.parent.getWorldQuaternion(q).invert();
        off.applyQuaternion(q);
      }
      p.mesh.position.copy(p.base).add(off);
    });

    const focus = new THREE.Vector3(
      look.tx * modelSize.x,
      look.ty * modelSize.y,
      look.tz * modelSize.z
    );
    const dist = 3.2 * look.zoom;
    const az = THREE.MathUtils.degToRad(look.az);
    const el = THREE.MathUtils.degToRad(look.el);
    camera.position.set(
      focus.x + Math.cos(el) * Math.sin(az) * dist,
      focus.y + Math.sin(el) * dist,
      focus.z + Math.cos(el) * Math.cos(az) * dist
    );
    camera.lookAt(focus);
    pivot.rotation.y = 0.15 * (1 - explodeT);
    renderer.render(scene, camera);
  }

  renderFrame(0);
  log(`Ready · ${meshes.length} meshes`);
  runBtn.disabled = false;
  hint.textContent = `Preset: ${id} · ready · ${preset.frames} frames`;

  async function captureAll() {
    runBtn.disabled = true;
    const frames = [];
    log("Capturing…");
    for (let i = 0; i < preset.frames; i++) {
      const t = 1 - i / (preset.frames - 1);
      renderFrame(t);
      frames.push(canvas.toDataURL("image/webp", 0.88));
      if (i % 8 === 0 || i === preset.frames - 1) log(`  frame ${i + 1}/${preset.frames}`);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.__FRAMES = frames;
    window.__CAPTURE_DONE = true;
    log("Done — frames in memory");
    return frames;
  }

  runBtn.addEventListener("click", async () => {
    try {
      const frames = await captureAll();
      if ("showDirectoryPicker" in window) {
        const dir = await window.showDirectoryPicker();
        for (let i = 0; i < frames.length; i++) {
          const name = `${String(i + 1).padStart(4, "0")}.webp`;
          const blob = await (await fetch(frames[i])).blob();
          const fh = await dir.getFileHandle(name, { create: true });
          const w = await fh.createWritable();
          await w.write(blob);
          await w.close();
        }
        const manifest = {
          id,
          frameCount: frames.length,
          ext: "webp",
          pad: 4,
          prefix: "",
          width: W,
          height: H,
        };
        const mf = await dir.getFileHandle("manifest.json", { create: true });
        const mw = await mf.createWritable();
        await mw.write(JSON.stringify(manifest, null, 2));
        await mw.close();
        log(`Saved → put folder at public/sequences/${id}/`);
      } else {
        log("No folder picker — Playwright auto capture writes files for you.");
      }
    } catch (err) {
      window.__CAPTURE_ERROR = String(err);
      log(String(err));
      runBtn.disabled = false;
    }
  });

  if (auto) {
    try {
      await captureAll();
    } catch (err) {
      window.__CAPTURE_ERROR = String(err);
      window.__CAPTURE_DONE = true;
      log(String(err));
    }
  }
}
