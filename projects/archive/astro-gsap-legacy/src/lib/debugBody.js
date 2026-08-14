import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** Minimal isolator for /models/iron-man-body.glb */
export function initDebugBody() {
  const hud = document.getElementById("hud");
  const canvas = document.getElementById("c");
  if (!(canvas instanceof HTMLCanvasElement) || !hud) return;

  const log = (msg, err = false) => {
    hud.textContent = msg;
    hud.classList.toggle("err", err);
    console[err ? "error" : "info"](msg);
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1e24);

  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 100);
  camera.position.set(0, 1.0, 4.0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.9, 0);
  controls.update();

  scene.add(new THREE.AmbientLight(0xffffff, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2, 4, 3);
  scene.add(key);

  scene.add(new THREE.GridHelper(6, 24, 0x8888aa, 0x333344));
  scene.add(new THREE.AxesHelper(1.5));

  const SRC = "/models/iron-man-body.glb";
  log(`fetching ${SRC}`);

  new GLTFLoader().load(
    SRC,
    (gltf) => {
      const root = gltf.scene;
      let meshes = 0;
      let tris = 0;

      root.traverse((o) => {
        if (!o.isMesh) return;
        meshes++;
        if (o.material) {
          const old = Array.isArray(o.material) ? o.material : [o.material];
          old.forEach((m) => m?.dispose?.());
        }
        o.material = new THREE.MeshStandardMaterial({
          color: 0xe8ecf2,
          metalness: 0.25,
          roughness: 0.45,
          emissive: new THREE.Color(0x3a4250),
          emissiveIntensity: 0.35,
          side: THREE.DoubleSide,
          vertexColors: false,
        });
        o.frustumCulled = false;
        if (o.geometry?.attributes?.color) o.geometry.deleteAttribute("color");
        const g = o.geometry;
        const idx = g?.index;
        tris += idx ? idx.count / 3 : (g?.attributes?.position?.count || 0) / 3;
      });

      // Scale first, then center (T*R*S — center-then-scale parks STL meshes off-camera)
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      root.scale.setScalar(1.8 / maxDim);
      root.updateMatrixWorld(true);
      const scaled = new THREE.Box3().setFromObject(root);
      root.position.sub(scaled.getCenter(new THREE.Vector3()));
      root.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(root);
      const fs = fitted.getSize(new THREE.Vector3());
      const fc = fitted.getCenter(new THREE.Vector3());
      root.position.y -= fc.y;
      root.position.y += fs.y * 0.5 + 0.01; // feet near y=0
      root.updateMatrixWorld(true);
      const finalBox = new THREE.Box3().setFromObject(root);

      scene.add(root);

      log(
        `OK meshes=${meshes} tris≈${Math.round(tris)}\n` +
          `raw ${size.x.toFixed(0)}×${size.y.toFixed(0)}×${size.z.toFixed(0)}\n` +
          `fitted ${fs.x.toFixed(2)}×${fs.y.toFixed(2)}×${fs.z.toFixed(2)}\n` +
          `world center (${finalBox.getCenter(new THREE.Vector3()).toArray().map((n) => n.toFixed(2)).join(", ")})\n` +
          `drag to orbit`
      );
    },
    (xhr) => {
      if (xhr.total) log(`loading ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
    },
    (err) => log(`FAIL ${err?.message || err}`, true)
  );

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  });

  (function tick() {
    requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  })();
}
