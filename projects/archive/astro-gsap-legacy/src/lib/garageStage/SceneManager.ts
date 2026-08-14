/**
 * SceneManager — owns the WebGL renderer, scene, lighting rig, and HDRI environment.
 * Extracted from the old 747-line createGarageStage god-function.
 */
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { GarageTheme } from "./types";

export interface SceneManagerOptions {
  canvas: HTMLCanvasElement;
  theme: GarageTheme;
  mobileLite: boolean;
}

export interface SceneManagerApi {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  ground: THREE.Mesh;
  resize(): void;
  render(): void;
  dispose(): void;
}

export function createSceneManager({ canvas, theme, mobileLite }: SceneManagerOptions): SceneManagerApi {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobileLite,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileLite ? 1.25 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = theme.exposure;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.bg);
  scene.fog = new THREE.FogExp2(theme.bg, theme.fogDensity);

  // Camera
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 200);

  // Environment — start with room env, upgrade to HDRI when loaded
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = theme.envIntensity;

  new RGBELoader().load(
    theme.hdri,
    (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      scene.environmentIntensity = theme.envIntensity;
      hdr.dispose();
    },
    undefined,
    () => {} // Silently fall back to room env
  );

  // Lighting rig
  scene.add(new THREE.AmbientLight(0xffffff, theme.ambient));
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x1a1a22, theme.hemi));

  const key = new THREE.DirectionalLight(theme.key, theme.keyInt);
  key.position.set(4, 7, 3.5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(theme.fill, theme.fillInt);
  fill.position.set(-5, 2, -2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(theme.rim, theme.rimInt);
  rim.position.set(-1.5, 3, 5);
  scene.add(rim);

  if (theme.frontInt > 0) {
    const front = new THREE.DirectionalLight(0xffffff, theme.frontInt);
    front.position.set(0, 2.5, 7);
    scene.add(front);
  }

  // Pivot group — model goes here, rotation applied to pivot
  const pivot = new THREE.Group();
  scene.add(pivot);

  // Ground disc
  const groundMat = new THREE.MeshStandardMaterial({
    color: theme.bg,
    metalness: 0.35,
    roughness: 0.9,
    transparent: true,
    opacity: 0.4,
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = false;
  scene.add(ground);

  // Resize
  function resize() {
    const wrap = canvas.parentElement;
    const w = wrap?.clientWidth || window.innerWidth;
    const h = wrap?.clientHeight || Math.min(window.innerHeight * 0.72, 560);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    renderer.dispose();
    groundMat.dispose();
    ground.geometry.dispose();
    pmrem.dispose();
  }

  return { renderer, scene, camera, pivot, ground, resize, render, dispose };
}
