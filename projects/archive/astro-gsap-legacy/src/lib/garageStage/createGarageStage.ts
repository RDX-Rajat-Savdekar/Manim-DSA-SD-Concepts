/**
 * createGarageStage — slim orchestrator that wires all modules together.
 * ~170 lines instead of the old 747-line god-function.
 */
import * as THREE from "three";
import { gsap } from "../gsap";
import { GARAGE_THEMES } from "./themes";
import { createSceneManager } from "./SceneManager";
import { createCameraRig } from "./CameraRig";
import { createModelLoader } from "./ModelLoader";
import { createPinnedBeatController } from "./BeatController";
import { createGarageHud } from "./GarageHud";
import { createVfxSuite } from "./vfx/index";
import { retargetClipsToRoot } from "./retargetMixamo";
import type { Beat, ThemeKey, ScrubPayload, FxConfig, VfxSystem, VfxContext } from "./types";

const isMobile = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches);

export interface GarageStageOptions {
  canvas: HTMLCanvasElement;
  modelSrc: string;
  animSrc?: string | null;
  themeKey?: ThemeKey;
  beats?: Beat[];
  pinEl?: HTMLElement | null;
  root?: HTMLElement | null;
  onReady?: (info: { hasClips?: boolean }) => void;
}

export function createGarageStage({
  canvas, modelSrc, animSrc = null, themeKey = "f1", beats = [], pinEl, root, onReady,
}: GarageStageOptions) {
  if (!(canvas instanceof HTMLCanvasElement) || !modelSrc) {
    return { destroy() {}, scrollToBeat() {} };
  }

  const theme = GARAGE_THEMES[themeKey] || GARAGE_THEMES.f1;
  const mobileLite = isMobile();
  const motionOff = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hudRoot = (root || pinEl?.closest?.("[data-garage3d]") || canvas.closest("[data-garage3d]")) as HTMLElement;

  // 1. Scene
  const sm = createSceneManager({ canvas, theme, mobileLite });

  // 2. Camera
  const cam = createCameraRig({ camera: sm.camera, canvas, pivot: sm.pivot, motionOff, mobileLite });

  // 3. Model loader
  const ml = createModelLoader();

  // State
  let modelSize = new THREE.Vector3(1, 1, 1);
  let baseDistance = 3.2;
  let parts: ReturnType<typeof ml.buildExplodeParts> = [];
  const explode = { t: 0.35, smooth: { value: 0.35 } };
  const motion = { spinMul: 0.4 };
  let currentFx: FxConfig = {};
  let ready = false;
  let raf = 0;
  let destroyed = false;
  let beatCtl: ReturnType<typeof createPinnedBeatController> | null = null;
  let vfxSystems: VfxSystem[] = [];
  let pinActive = true;
  const clock = new THREE.Clock();

  // 4. HUD
  const hud = createGarageHud({
    root: hudRoot, beats, themeKey, motionOff,
    scrollToBeat: (i: number) => beatCtl?.scrollToBeat(i),
    getProjection: (localNorm: THREE.Vector3) => cam.getProjection(localNorm, modelSize),
  });

  // 5. Beat callbacks
  function onScrub(payload: ScrubPayload) {
    cam.setLook(payload.look);
    explode.t = payload.explode;
    motion.spinMul = payload.spin;
    currentFx = payload.fx;
    hud.onScrub(payload);
  }

  function onActiveBeat(beat: Beat) {
    currentFx = beat.fx;
    hud.onActiveBeat(beat);
  }

  // 6. Tick loop
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (!ready) { sm.render(); return; }

    const time = performance.now() * 0.001;

    if (!motionOff) {
      // Pivot rotation (slow turntable)
      const spinScale = themeKey === "iron-man" ? 0 : 1;
      const yaw = themeKey === "f1"
        ? theme.spin * Math.max(0.18, motion.spinMul)
        : theme.spin * motion.spinMul * spinScale;
      sm.pivot.rotation.y += yaw;

      // Iron Man bobbing
      if (themeKey === "iron-man") {
        const thrustVal = typeof currentFx.thrust === "number" ? currentFx.thrust : 0;
        if (thrustVal > 0.05) {
          sm.pivot.position.y = Math.sin(time * 3.5) * 0.022 * Math.min(1.0, thrustVal);
          sm.pivot.rotation.x = thrustVal * -0.06;
        } else {
          sm.pivot.position.y = 0;
          sm.pivot.rotation.x = 0;
        }
      }

      // VFX update
      const vfxCtx: VfxContext = {
        scene: sm.scene, modelRoot: sm.pivot.children[0] || sm.pivot,
        pivot: sm.pivot, modelSize, themeKey, theme, mobileLite, motionOff,
      };
      for (const sys of vfxSystems) {
        sys.update(dt, time, currentFx, vfxCtx);
      }

      // Camera shake
      const rumble = (currentFx.engineRumble ? 1 : 0) + (typeof currentFx.shake === "number" ? currentFx.shake : 0);
      if (rumble > 0.05 && pinActive) cam.applyShake(rumble, time);
    }

    cam.update(modelSize, baseDistance);
    ml.applyExplode(parts, explode.t, explode.smooth);
    hud.onFrame();
    sm.render();
  }

  // 7. Boot model
  async function bootModel() {
    try {
      const animUrl = animSrc || (themeKey === "iron-man" ? "/models/mixamo-anims.glb" : null);
      const [modelRoot, animClips] = await Promise.all([
        ml.loadModel(modelSrc),
        animUrl ? ml.loadAnimations(animUrl) : Promise.resolve([]),
      ]);
      if (destroyed) return;

      ml.fixMaterials(modelRoot, theme);
      const fit = ml.fitModel(modelRoot, sm.ground);
      modelSize = fit.modelSize;
      baseDistance = fit.baseDistance;

      // Check if skinned — if not, build explode parts
      let isSkinned = false;
      modelRoot.traverse((c) => { if ((c as THREE.SkinnedMesh).isSkinnedMesh) isSkinned = true; });
      if (!isSkinned) parts = ml.buildExplodeParts(modelRoot, modelSize);

      sm.pivot.add(modelRoot);

      // Adjust camera defaults for wide models
      if (modelSize.x > modelSize.y * 1.35 || modelSize.z > modelSize.y * 1.35) {
        cam.setLook({ azimuth: 40, elevation: 14, zoom: 1, tx: 0.22, ty: 0.12, tz: 0, fov: 28 });
      }

      // Init VFX
      const vfxCtx: VfxContext = {
        scene: sm.scene, modelRoot, pivot: sm.pivot, modelSize, themeKey, theme, mobileLite, motionOff,
      };
      vfxSystems = createVfxSuite(vfxCtx);

      ready = true;

      // Intro explode animation
      explode.t = 0.28;
      explode.smooth.value = 0.28;
      if (!motionOff) {
        gsap.to(explode, { t: 0, duration: 1.5, ease: "power3.out", delay: 0.05 });
      } else {
        explode.t = 0;
        explode.smooth.value = 0;
      }

      // Wire beat controller
      const pinTarget = pinEl || canvas.parentElement;
      if (beats.length && pinTarget) {
        beatCtl = createPinnedBeatController({
          trigger: pinTarget as HTMLElement,
          beats, onScrub, onActiveBeat,
          onPinToggle(active: boolean) {
            pinActive = active;
          },
        });
      }

      sm.resize();
      cam.snap(modelSize, baseDistance);
      onReady?.({ hasClips: false });
    } catch (err) {
      console.error("[garageStage] model load failed:", err);
    }
  }

  async function changeModel(url: string) {
    ready = false;
    const loading = hudRoot.querySelector("[data-garage3d-loading]") as HTMLElement | null;
    if (loading) {
      loading.classList.remove("is-done");
      loading.textContent = "Loading new car model…";
    }

    try {
      // Clear previous model from pivot
      if (sm.pivot.children.length > 0) {
        const prev = sm.pivot.children[0];
        sm.pivot.remove(prev);
        prev.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mesh = c as THREE.Mesh;
            mesh.geometry.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m?.dispose());
          }
        });
      }

      // Dispose previous VFX
      vfxSystems.forEach((s) => s.dispose());
      vfxSystems = [];

      const modelRoot = await ml.loadModel(url);
      if (destroyed) return;

      ml.fixMaterials(modelRoot, theme);
      const fit = ml.fitModel(modelRoot, sm.ground);
      modelSize = fit.modelSize;
      baseDistance = fit.baseDistance;

      let isSkinned = false;
      modelRoot.traverse((c) => { if ((c as THREE.SkinnedMesh).isSkinnedMesh) isSkinned = true; });
      if (!isSkinned) {
        parts = ml.buildExplodeParts(modelRoot, modelSize);
      } else {
        parts = [];
      }

      sm.pivot.add(modelRoot);

      // Re-initialize VFX for new model root
      const vfxCtx: VfxContext = {
        scene: sm.scene, modelRoot, pivot: sm.pivot, modelSize, themeKey, theme, mobileLite, motionOff,
      };
      vfxSystems = createVfxSuite(vfxCtx);

      ready = true;
      if (loading) loading.classList.add("is-done");

      // Brief intro animation
      explode.t = 0.28;
      explode.smooth.value = 0.28;
      if (!motionOff) {
        gsap.to(explode, { t: 0, duration: 1.5, ease: "power3.out", delay: 0.05 });
      } else {
        explode.t = 0;
        explode.smooth.value = 0;
      }

      sm.resize();
      cam.snap(modelSize, baseDistance);
    } catch (err) {
      console.error("[garageStage] failed to change model:", err);
      if (loading) loading.textContent = "Error loading car model.";
    }
  }

  bootModel();
  sm.resize();
  window.addEventListener("resize", sm.resize);
  tick();

  return {
    scrollToBeat(i: number) { beatCtl?.scrollToBeat(i); },
    changeModel,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      beatCtl?.kill();
      hud.destroy();
      vfxSystems.forEach((s) => s.dispose());
      window.removeEventListener("resize", sm.resize);
      ml.dispose();
      sm.dispose();
    },
  };
}
