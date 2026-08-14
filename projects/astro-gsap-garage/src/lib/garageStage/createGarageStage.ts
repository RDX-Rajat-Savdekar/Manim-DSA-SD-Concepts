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
import { createClipPlayer, type ClipPlayer } from "./ClipPlayer";
import { aliasClipName, retargetClipsToRoot, shouldDropClip } from "./retargetMixamo";
import { createRigSockets, type RigSockets } from "./RigSockets";
import type { Beat, ThemeKey, ScrubPayload, FxConfig, VfxSystem, VfxContext, Look } from "./types";

/** Front-on framing for animation lab — matches working hero shot on /iron-man. */
export const DEBUG_FRONT_LOOK: Look = {
  azimuth: 32,
  elevation: 8,
  zoom: 1.15,
  tx: 0,
  ty: 0.08,
  tz: 0,
  fov: 32,
};

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
  onReady?: (info: { hasClips?: boolean; clips?: string[] }) => void;
  /** Shorter scrub distance for compact finale stages. */
  endPerBeat?: number;
  /** Skip scroll pin + cinematic looks; keep a fixed camera for clip testing. */
  debug?: {
    staticLook?: Look;
  };
  /**
   * Clips come from the same Mixamo character as the skinned model.
   * Uses name remap only (no rest-relative) — avoids crossed-arm retarget bugs.
   */
  sameMixamoSkeleton?: boolean;
}

export function createGarageStage({
  canvas, modelSrc, animSrc = null, themeKey = "f1", beats = [], pinEl, root, onReady, debug,
  sameMixamoSkeleton = false,
  endPerBeat,
}: GarageStageOptions) {
  if (!(canvas instanceof HTMLCanvasElement) || !modelSrc) {
    return {
      destroy() {},
      scrollToBeat() {},
      playClip() {},
      setFx() {},
      setLook() {},
      getLook: () => ({ ...DEBUG_FRONT_LOOK }),
      listClips: () => [] as string[],
    };
  }

  const theme = GARAGE_THEMES[themeKey] || GARAGE_THEMES.f1;
  const mobileLite = isMobile();
  const motionOff = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hudRoot = (root || pinEl?.closest?.("[data-garage3d]") || canvas.closest("[data-garage3d]") || canvas.parentElement) as HTMLElement;
  const debugMode = Boolean(debug);
  const staticLook = debug?.staticLook || (debugMode ? DEBUG_FRONT_LOOK : null);

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
  let currentFx: FxConfig = debugMode
    ? { clip: "standing", thrust: 0.05, eyeGlow: 0.4 }
    : {};
  let ready = false;
  let raf = 0;
  let destroyed = false;
  let beatCtl: ReturnType<typeof createPinnedBeatController> | null = null;
  let vfxSystems: VfxSystem[] = [];
  let clipPlayer: ClipPlayer | null = null;
  let clipDriven = false;
  let lastClip = "";
  let sockets: RigSockets | null = null;
  let pinActive = !debugMode;
  const clock = new THREE.Clock();

  // 4. HUD (skipped in debug lab — no strip / hotspots markup)
  const hud = debugMode
    ? { onActiveBeat() {}, onScrub() {}, onFrame() {}, destroy() {} }
    : createGarageHud({
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

  function syncClipFromFx(fx: FxConfig, fade = 0.4) {
    if (!clipPlayer || motionOff) return;
    const want = typeof fx.clip === "string" ? fx.clip : "standing";
    const reverse = Boolean(fx.clipReverse);
    const key = `${want}${reverse ? ":rev" : ""}`;
    if (key === lastClip) return;
    clipPlayer.play(want, fade, { reverse });
    lastClip = key;
  }

  function onJumpToBeat(beat: Beat) {
    currentFx = beat.fx;
    cam.setLook(beat.look);
    cam.snap(modelSize, baseDistance);
    syncClipFromFx(beat.fx, 0.25);
  }

  // 6. Tick loop
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (!ready) { sm.render(); return; }

    const time = performance.now() * 0.001;

    if (!motionOff) {
      // Pivot rotation — F1 turntable; Iron Man uses camera orbit + drift instead
      if (themeKey === "f1") {
        sm.pivot.rotation.y += theme.spin * Math.max(0.18, motion.spinMul);
      } else if (themeKey === "iron-man" && !debugMode) {
        // Gentle yaw from beat spin so the suit still breathes between camera moves
        sm.pivot.rotation.y += theme.spin * motion.spinMul * 0.35;
      }

      // Iron Man bobbing (skip in debug so Mixamo pose is clear)
      if (themeKey === "iron-man" && !debugMode) {
        const thrustVal = typeof currentFx.thrust === "number" ? currentFx.thrust : 0;
        if (thrustVal > 0.05) {
          sm.pivot.position.y = Math.sin(time * 3.5) * 0.022 * Math.min(1.0, thrustVal);
          sm.pivot.rotation.x = thrustVal * -0.06;
        } else {
          sm.pivot.position.y = 0;
          sm.pivot.rotation.x = 0;
        }
      }

      // Mixamo clip crossfade (owned by AnimationMixer)
      if (clipPlayer) {
        syncClipFromFx(currentFx);
        clipPlayer.update(dt);
      }

      const modelRoot = sm.pivot.children[0] || sm.pivot;
      modelRoot.updateMatrixWorld(true);
      sockets?.update();

      // VFX update
      const vfxCtx: VfxContext = {
        scene: sm.scene, modelRoot,
        pivot: sm.pivot, modelSize, themeKey, theme, mobileLite, motionOff, clipDriven,
        camera: sm.camera,
        sockets: sockets || undefined,
        clipProgress: clipPlayer?.progress() ?? 0,
        clipName: clipPlayer?.currentName() || "",
      };
      for (const sys of vfxSystems) {
        sys.update(dt, time, currentFx, vfxCtx);
      }

      // Camera shake (disabled in debug lab)
      if (!debugMode) {
        const rumble = (currentFx.engineRumble ? 1 : 0) + (typeof currentFx.shake === "number" ? currentFx.shake : 0);
        if (rumble > 0.05 && pinActive) cam.applyShake(rumble, time);
      }
    }

    // Subtle idle camera drift for Iron Man cinematic page
    if (themeKey === "iron-man" && !debugMode && !motionOff) {
      cam.applyDrift(time, 1);
    } else {
      cam.applyDrift(time, 0);
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
      const [modelRoot, animPack] = await Promise.all([
        ml.loadModel(modelSrc),
        animUrl ? ml.loadAnimPack(animUrl) : Promise.resolve({ clips: [] as THREE.AnimationClip[], sourceRoot: null }),
      ]);
      if (destroyed) return;
      const animClips = animPack.clips;

      ml.fixMaterials(modelRoot, theme);
      const fit = ml.fitModel(modelRoot, sm.ground);
      modelSize = fit.modelSize;
      baseDistance = fit.baseDistance;

      // Check if skinned — if not, build explode parts
      let isSkinned = false;
      modelRoot.traverse((c) => { if ((c as THREE.SkinnedMesh).isSkinnedMesh) isSkinned = true; });
      if (!isSkinned) parts = ml.buildExplodeParts(modelRoot, modelSize);

      sm.pivot.add(modelRoot);

      sockets = createRigSockets(modelRoot);

      // Retarget Mixamo pack onto the suit skeleton and start the mixer
      clipPlayer?.dispose();
      clipPlayer = null;
      clipDriven = false;
      lastClip = "";
      if (animClips.length && !motionOff) {
        const renamed = animClips
          .filter((c) => !shouldDropClip(c.name))
          .map((c) => {
            const name = aliasClipName(c.name);
            if (name === c.name) return c;
            const clone = c.clone();
            clone.name = name;
            return clone;
          });
        const retargeted = retargetClipsToRoot(modelRoot, renamed, {
          inplace: true,
          rotationsOnly: true,
          mode: sameMixamoSkeleton ? "naive" : "restRelative",
          sourceRoot: sameMixamoSkeleton ? null : animPack.sourceRoot,
        }).filter((c) => {
          const n = String(c.name).toLowerCase();
          return Boolean(n) && !n.includes("armature") && !n.includes("layer") && !shouldDropClip(n);
        });
        if (retargeted.length) {
          clipPlayer = createClipPlayer(modelRoot, retargeted);
          clipDriven = clipPlayer.size > 0;
          if (clipDriven) {
            const startClip = typeof currentFx.clip === "string" ? currentFx.clip : "standing";
            const reverse = Boolean(currentFx.clipReverse);
            clipPlayer.play(startClip, 0.01, { reverse });
            lastClip = `${startClip}${reverse ? ":rev" : ""}`;
          }
        }
      }

      // Adjust camera
      if (staticLook) {
        cam.setLook(staticLook);
      } else if (modelSize.x > modelSize.y * 1.35 || modelSize.z > modelSize.y * 1.35) {
        cam.setLook({ azimuth: 40, elevation: 14, zoom: 1, tx: 0.22, ty: 0.12, tz: 0, fov: 28 });
      }

      // Init VFX
      const vfxCtx: VfxContext = {
        scene: sm.scene, modelRoot, pivot: sm.pivot, modelSize, themeKey, theme, mobileLite, motionOff, clipDriven,
        camera: sm.camera,
        sockets: sockets || undefined,
      };
      vfxSystems = createVfxSuite(vfxCtx);

      ready = true;

      // Intro explode animation (skip in debug — keep suit assembled + still)
      if (debugMode) {
        explode.t = 0;
        explode.smooth.value = 0;
      } else {
        explode.t = 0.28;
        explode.smooth.value = 0.28;
        if (!motionOff) {
          gsap.to(explode, { t: 0, duration: 1.5, ease: "power3.out", delay: 0.05 });
        } else {
          explode.t = 0;
          explode.smooth.value = 0;
        }
      }

      // Wire beat controller (skip in debug — no scroll pin / cinematic scrub)
      const pinTarget = pinEl || canvas.parentElement;
      if (!debugMode && beats.length && pinTarget) {
        beatCtl = createPinnedBeatController({
          trigger: pinTarget as HTMLElement,
          beats, onScrub, onActiveBeat, onJumpToBeat,
          endPerBeat: endPerBeat ?? 75,
          onPinToggle(active: boolean) {
            pinActive = active;
          },
        });
      }

      sm.resize();
      cam.snap(modelSize, baseDistance);
      const clipNames = clipPlayer?.names() || [];
      onReady?.({ hasClips: clipDriven, clips: clipNames });
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
        camera: sm.camera,
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
    playClip(name: string, opts?: { reverse?: boolean }) {
      const clip = String(name || "idle").toLowerCase();
      currentFx = { ...currentFx, clip, clipReverse: Boolean(opts?.reverse) };
      syncClipFromFx(currentFx, 0.25);
    },
    setFx(fx: FxConfig) {
      currentFx = { ...fx };
      syncClipFromFx(currentFx, 0.25);
    },
    setLook(look: Look, snap = true) {
      cam.setLook(look);
      if (snap) cam.snap(modelSize, baseDistance);
    },
    getLook(): Look {
      return cam.getLook();
    },
    listClips() {
      return clipPlayer?.names() || [];
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      beatCtl?.kill();
      hud.destroy();
      clipPlayer?.dispose();
      clipPlayer = null;
      vfxSystems.forEach((s) => s.dispose());
      window.removeEventListener("resize", sm.resize);
      ml.dispose();
      sm.dispose();
    },
  };
}
