/**
 * Interactive Mixamo → Mark 85 retarget lab.
 * Route: /debug/iron-man-rig
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { retargetClipsToRoot, collectBoneMap } from "./garageStage/retargetMixamo.js";

const SUIT = "/models/iron-man-rigged.glb";
const ANIMS = "/models/mixamo-anims.glb";
/** Mixamo bind pose (Without Skin FBX) — needed for restRelative */
const BIND_FBX = "/models/_src/mixamo/Flying.fbx";

export function initDebugIronManRig() {
  const canvas = document.getElementById("c");
  const logEl = document.getElementById("log");
  const clipSel = document.getElementById("clip");
  const modeSel = document.getElementById("mode");
  const playBtn = document.getElementById("play");
  const bindBtn = document.getElementById("bind");
  const skelToggle = document.getElementById("skel");
  const statusEl = document.getElementById("status");

  if (!(canvas instanceof HTMLCanvasElement)) return;

  const log = (msg, isErr = false) => {
    if (logEl) {
      logEl.textContent = `${logEl.textContent}\n${msg}`.trim().slice(-4000);
      logEl.classList.toggle("err", isErr);
    }
    console[isErr ? "error" : "info"](msg);
  };

  const setStatus = (msg) => {
    if (statusEl) statusEl.textContent = msg;
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0c10);

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 80);
  camera.position.set(1.6, 1.2, 3.2);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaccff, 0.7);
  fill.position.set(-3, 2, -2);
  scene.add(fill);
  scene.add(new THREE.GridHelper(5, 20, 0x444455, 0x222230));
  scene.add(new THREE.AxesHelper(0.6));

  const clock = new THREE.Clock();
  /** @type {THREE.Object3D | null} */
  let suitRoot = null;
  /** @type {THREE.Object3D | null} */
  let animRoot = null;
  /** @type {THREE.AnimationClip[]} */
  let sourceClips = [];
  /** @type {THREE.AnimationMixer | null} */
  let mixer = null;
  /** @type {THREE.AnimationAction | null} */
  let action = null;
  /** @type {THREE.SkeletonHelper | null} */
  let helper = null;
  let playing = true;

  function fit(object) {
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
    object.position.y -= fitted.min.y;
  }

  function loadGltf(url) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    return Promise.resolve(MeshoptDecoder.ready).then(
      () =>
        new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        })
    );
  }

  function rebuildClips() {
    if (!suitRoot || !sourceClips.length) return;
    const mode = modeSel?.value || "restRelative";
    const retargeted = retargetClipsToRoot(suitRoot, sourceClips, {
      mode,
      sourceRoot: animRoot,
      rotationsOnly: true,
      inplace: true,
    });

    mixer?.stopAllAction();
    mixer = new THREE.AnimationMixer(suitRoot);

    if (clipSel) {
      const prev = clipSel.value;
      clipSel.innerHTML = "";
      retargeted.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.name;
        opt.textContent = `${c.name} (${c.duration.toFixed(2)}s, ${c.tracks.length} tr)`;
        clipSel.appendChild(opt);
      });
      if ([...clipSel.options].some((o) => o.value === prev)) clipSel.value = prev;
    }

    // stash on mixer via userData
    mixer.userData = { clips: retargeted };
    playSelected();
    setStatus(`mode=${mode} · ${retargeted.length} clips · bones=${collectBoneMap(suitRoot).size}`);
    log(`Rebuilt clips as [${mode}]`);
  }

  function playSelected() {
    if (!mixer?.userData?.clips) return;
    const name = clipSel?.value;
    const clip = mixer.userData.clips.find((c) => c.name === name) || mixer.userData.clips[0];
    if (!clip) return;
    mixer.stopAllAction();
    action = mixer.clipAction(clip);
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play();
    playing = true;
    if (playBtn) playBtn.textContent = "Pause";
    log(`Playing ${clip.name}`);
  }

  function toBindPose() {
    mixer?.stopAllAction();
    action = null;
    if (!suitRoot) return;
    suitRoot.traverse((o) => {
      if (o.isSkinnedMesh && o.skeleton) o.skeleton.pose();
    });
    playing = false;
    if (playBtn) playBtn.textContent = "Play";
    log("Bind pose (skeleton.pose())");
  }

  playBtn?.addEventListener("click", () => {
    if (!action) {
      playSelected();
      return;
    }
    playing = !playing;
    action.paused = !playing;
    playBtn.textContent = playing ? "Pause" : "Play";
  });
  bindBtn?.addEventListener("click", toBindPose);
  clipSel?.addEventListener("change", playSelected);
  modeSel?.addEventListener("change", rebuildClips);
  skelToggle?.addEventListener("change", () => {
    if (helper) helper.visible = Boolean(skelToggle.checked);
  });

  function loadFbx(url) {
    const loader = new FBXLoader();
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  setStatus("Loading…");
  log(`Loading ${SUIT} + ${ANIMS} + bind ${BIND_FBX}`);

  Promise.all([
    loadGltf(SUIT),
    loadGltf(ANIMS),
    loadFbx(BIND_FBX).catch((err) => {
      log(`Bind FBX missing (${err}) — restRelative will fall back to naive`, true);
      return null;
    }),
  ])
    .then(([suitGltf, animGltf, bindFbx]) => {
      suitRoot = suitGltf.scene;
      animRoot = bindFbx || animGltf.scene;
      sourceClips = animGltf.animations || [];

      fit(suitRoot);
      scene.add(suitRoot);

      helper = new THREE.SkeletonHelper(suitRoot);
      helper.visible = Boolean(skelToggle?.checked);
      scene.add(helper);

      if (animRoot && animRoot !== suitRoot) {
        animRoot.visible = false;
        animRoot.scale.setScalar(0.01);
        animRoot.position.set(20, 0, 0);
        scene.add(animRoot);
      }

      const suitBones = [...collectBoneMap(suitRoot).entries()];
      const animBones = [...collectBoneMap(animRoot).entries()];
      const matched = suitBones.filter(([k]) => animBones.some(([ak]) => ak === k));
      log(
        `Suit bones ${suitBones.length} · Bind bones ${animBones.length} · matched ${matched.length}`
      );
      log(`Source clips: ${sourceClips.map((c) => c.name).join(", ") || "(none)"}`);
      log(`Bind source: ${bindFbx ? BIND_FBX : "anim pack scene"}`);

      rebuildClips();
    })
    .catch((err) => {
      log(String(err), true);
      setStatus("Load failed — check public/models/*.glb");
    });

  function onResize() {
    camera.aspect = innerWidth / Math.max(innerHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }
  window.addEventListener("resize", onResize);

  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (mixer && playing) mixer.update(dt);
    controls.update();
    renderer.render(scene, camera);
  }
  tick();
}
