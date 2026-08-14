import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { gsap, ScrollTrigger, ScrollToPlugin } from "../../../lib/gsap.js";
import { createBeatController } from "../../../lib/productBeats.js";
import { loadAssemblySequence, bindAssemblyScroll } from "../../../lib/assemblySequence.js";

void ScrollToPlugin;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isCoarseMobile = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches);

/** Active Theory–style film grain + mild grade */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.045 },
    uVignette: { value: 0.42 },
    uWarm: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uWarm;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float g = hash(vUv * vec2(1920.0, 1080.0) + uTime) - 0.5;
      c.rgb += g * uGrain;
      c.rgb += vec3(0.02, 0.01, -0.015) * uWarm;
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - smoothstep(0.35, 0.98, d) * uVignette;
      gl_FragColor = c;
    }
  `,
};

const THEME = {
  "iron-man": {
    key: 0xffe8d0,
    fill: 0x6a80ff,
    rim: 0xff2a2a,
    accent: 0xf5b301,
    spin: 0.001,
    exposure: 1.8,
    heroExposure: 1.22,
    warm: 0.4,
    hdri: "/hdri/empty_warehouse_01_2k.hdr",
    envIntensity: 1.28,
    heroEnvIntensity: 0.95,
    bgIntensity: 0.62,
    heroBgIntensity: 0.38,
    skyHeight: 12,
    skyRadius: 80,
  },
  f1: {
    key: 0xffffff,
    fill: 0xc8ffe8,
    rim: 0xff5577,
    accent: 0xff2d55,
    spin: 0.0014,
    exposure: 2.48,
    warm: -0.02,
    hdri: "/hdri/skylit_garage_2k.hdr",
    skyHeight: 10,
    skyRadius: 70,
    envIntensity: 3.6,
    bgIntensity: 0.48,
    vignette: 0.1,
    fogDensity: 0.001,
  },
  watch: {
    key: 0xfff2d8,
    fill: 0xc9a227,
    rim: 0xe8e0d0,
    accent: 0xc9a227,
    spin: 0.00045,
    exposure: 1.38,
    warm: 0.3,
    hdri: "/hdri/studio_small_09_1k.hdr",
    skyHeight: 8,
    skyRadius: 50,
  },
};

/**
 * AT-inspired product stage: studio world + lerped camera + parallax.
 * data-look="az,el,zoom,tx,ty,tz,fov"
 * data-hotspot="N|Label"
 * data-explode="0–1" scroll target for part separation
 * data-note="Title|Body" Sketchfab-style annotation card
 */
export function initProductStage() {
  const root = document.querySelector("[data-product-stage]");
  if (!root || root.dataset.ready === "1") return;
  root.dataset.ready = "1";

  const canvas = root.querySelector("[data-stage-canvas]");
  const assemblyCanvas = root.querySelector("[data-assembly-canvas]");
  const assemblySequenceUrl = root.dataset.assemblySequence || "";
  const loading = root.querySelector("[data-stage-loading]");
  const hotspotsEl = root.querySelector("[data-hotspots]");
  const noteEl = root.querySelector("[data-annotation-note]");
  const noteIndex = root.querySelector("[data-note-index]");
  const noteTitle = root.querySelector("[data-note-title]");
  const noteBody = root.querySelector("[data-note-body]");
  const stripEl = root.querySelector("[data-annotation-strip]");
  const dofBar = root.querySelector("[data-dof-bar]");
  const dofLabel = root.querySelector("[data-dof-label]");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const bg = root.dataset.bg || "#0a0a0b";
  const modelSrc = root.dataset.model;
  const themeKey = root.dataset.theme || "iron-man";
  const theme = THEME[themeKey] || THEME["iron-man"];
  if (!modelSrc) return;

  const motionOff = reducedMotion();
  const mobileLite = isCoarseMobile();
  const useDof = !motionOff && !mobileLite;
  const lerpSpeed = motionOff ? 1 : mobileLite ? 0.14 : 0.085;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobileLite,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileLite ? 1.35 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = theme.exposure;
  if (motionOff) root.classList.add("is-reduced-motion");
  if (mobileLite) root.classList.add("is-mobile-lite");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  // Light fog only — HDRI world provides depth
  const fogDensity =
    theme.fogDensity ?? (themeKey === "watch" ? 0.006 : themeKey === "f1" ? 0.0025 : 0.008);
  scene.fog = new THREE.FogExp2(bg, fogDensity);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 200);

  // Scroll target (scrubbed) vs displayed (lerped) — AT UIL lerpSpeed pattern
  const look = {
    azimuth: 28,
    elevation: themeKey === "watch" ? 4 : 8,
    zoom: 1,
    tx: 0.15,
    ty: themeKey === "watch" ? 0.02 : 0.08,
    tz: 0,
    fov: 28,
  };
  const lookSmooth = { ...look };
  const motion = { spinMul: 1 };
  const explode = { t: 0.75, smooth: 0.75 };
  const dof = { amount: 0.12, focus: 3.2 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  let baseDistance = 3.2;
  let modelSize = new THREE.Vector3(1, 1, 1);
  const focus = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const proj = new THREE.Vector3();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Photographed room as env + background (no GroundedSkybox mesh —
  // that mesh uses depthWrite:false and paints over the product).
  new RGBELoader().load(
    theme.hdri,
    (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const env = pmrem.fromEquirectangular(hdr).texture;
      scene.environment = env;
      scene.environmentIntensity =
        theme.envIntensity ?? (modelSrc.includes("body") ? 1.5 : themeKey === "f1" ? 3.6 : 1.28);
      scene.background = env;
      scene.backgroundBlurriness = themeKey === "f1" ? 0.12 : 0.08;
      scene.backgroundIntensity = theme.bgIntensity ?? (themeKey === "f1" ? 0.48 : 0.62);
      hdr.dispose();
    },
    undefined,
    () => {
      /* RoomEnvironment fallback already set */
    }
  );

  // Soft contact shadow under the product
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 64),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.92;
  contact.renderOrder = -1;
  scene.add(contact);

  scene.add(new THREE.AmbientLight(0xffffff, themeKey === "f1" ? 1.65 : 0.7));
  scene.add(
    new THREE.HemisphereLight(
      0xffffff,
      themeKey === "f1" ? 0x3a4555 : 0x444444,
      themeKey === "f1" ? 1.45 : 0.8
    )
  );
  const key = new THREE.DirectionalLight(theme.key, themeKey === "f1" ? 4.8 : 2.85);
  key.position.set(4.5, 7.5, 3.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(theme.fill, themeKey === "f1" ? 3.2 : 1.3);
  fill.position.set(-5.5, 2.2, -2.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(theme.rim, themeKey === "f1" ? 3.0 : 1.9);
  rim.position.set(-1.5, 3.5, 5.5);
  scene.add(rim);
  if (themeKey === "f1") {
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
  const accent = new THREE.PointLight(theme.accent, 1.7, 14);
  accent.position.set(0.15, 0.55, 1.4);
  scene.add(accent);
  if (!motionOff) {
    gsap.to(accent, { intensity: 2.35, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  const pivot = new THREE.Group();
  scene.add(pivot);
  const ground = contact;

  const isBodySculpture = modelSrc.includes("body");
  // Body STL + EffectComposer/Bokeh has been unreliable — draw directly
  const useComposer = !isBodySculpture;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokehPass = new BokehPass(scene, camera, {
    focus: 3.2,
    aperture: 0.00018,
    maxblur: 0.007,
  });
  bokehPass.enabled = useDof && useComposer;
  composer.addPass(bokehPass);
  const gradePass = new ShaderPass(GradeShader);
  gradePass.uniforms.uGrain.value = motionOff ? 0.02 : 0.04;
  gradePass.uniforms.uVignette.value = theme.vignette ?? 0.4;
  gradePass.uniforms.uWarm.value = theme.warm;
  composer.addPass(gradePass);
  if (dofBar?.closest?.(".dof-hud") instanceof HTMLElement) {
    dofBar.closest(".dof-hud").hidden = !bokehPass.enabled;
  }

  function parseExplode(el) {
    const raw = el.getAttribute("data-explode");
    if (raw == null || raw === "") return 0;
    const v = Number(raw);
    return Number.isFinite(v) ? THREE.MathUtils.clamp(v, 0, 1) : 0;
  }

  function parseNote(el) {
    const raw = el.getAttribute("data-note");
    if (!raw) return { title: "", body: "" };
    const [title, ...rest] = raw.split("|");
    return { title: title || "", body: rest.join("|") || "" };
  }

  function buildExplodeParts(model) {
    explodeParts = [];
    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
    if (meshes.length < 2) return;

    model.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    const world = new THREE.Vector3();

    // Thin assembly — parts separate just enough to read as plates, not debris
    explodeScale = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.11;

    meshes.forEach((mesh, i) => {
      const base = mesh.position.clone();
      mesh.getWorldPosition(world);
      const dir = world.sub(center);
      if (dir.lengthSq() < 1e-6) {
        const angle = (i / meshes.length) * Math.PI * 2;
        dir.set(Math.cos(angle), Math.sin(angle * 0.7), Math.sin(angle));
      }
      dir.normalize();
      const dist = explodeScale * THREE.MathUtils.lerp(0.7, 1.05, (i % 5) / 5);
      explodeParts.push({ mesh, base, dir, dist });
    });
  }

  function applyExplode() {
    if (!explodeParts.length || motionOff) return;
    const src = motionOff ? explode.t : explode.smooth;
    if (!motionOff) {
      explode.smooth += (explode.t - explode.smooth) * lerpSpeed;
    }
    for (const part of explodeParts) {
      _explodeOffset.copy(part.dir).multiplyScalar(src * part.dist);
      if (part.mesh.parent) {
        part.mesh.parent.getWorldQuaternion(_explodeQuat).invert();
        _explodeOffset.applyQuaternion(_explodeQuat);
      }
      part.mesh.position.copy(part.base).add(_explodeOffset);
    }
  }

  function syncAnnotationStrip(entry) {
    if (!(stripEl instanceof HTMLElement)) return;
    stripEl.querySelectorAll(".annotation-strip__btn").forEach((btn) => {
      const id = Number(btn.dataset.annotationId);
      btn.classList.toggle("is-active", entry?.n === id);
    });
  }

  function setActiveAnnotation(entry) {
    const key = entry?.n ?? null;
    if (key != null && activeAnnotation?.n === key) {
      hotspots.forEach((h) => h.el.classList.toggle("is-active", h === entry));
      syncAnnotationStrip(entry);
      return;
    }

    hotspots.forEach((h) => h.el.classList.toggle("is-active", h === entry));
    syncAnnotationStrip(entry || null);

    if (!(noteEl instanceof HTMLElement)) {
      activeAnnotation = entry || null;
      return;
    }

    if (!entry?.title) {
      noteEl.hidden = true;
      activeAnnotation = null;
      return;
    }

    activeAnnotation = entry;
    if (noteIndex) noteIndex.textContent = String(entry.n).padStart(2, "0");
    if (noteTitle) noteTitle.textContent = entry.title;
    if (noteBody) noteBody.textContent = entry.body;
    noteEl.hidden = false;
    gsap.fromTo(noteEl, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" });
    root.dispatchEvent(
      new CustomEvent("stage:annotationFocus", {
        detail: { id: entry.n, title: entry.title, body: entry.body },
      })
    );
  }

  function onActiveBeat(beat) {
    if (!beat) {
      setActiveAnnotation(null);
      return;
    }
    setActiveAnnotation(beat.hotspotEntry || null);
  }

  function setupAnnotationStrip() {
    if (!(stripEl instanceof HTMLElement) || mobileLite) return;
    stripEl.innerHTML = "";
    if (!hotspots.length) {
      stripEl.hidden = true;
      return;
    }
    stripEl.hidden = false;
    hotspots.forEach((entry) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "annotation-strip__btn";
      btn.dataset.annotationId = String(entry.n);
      btn.innerHTML = `<span>${String(entry.n).padStart(2, "0")}</span><small>${entry.label}</small>`;
      btn.setAttribute("aria-label", `Jump to ${entry.label}`);
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const beat = beatController?.beats.find((b) => b.n === entry.n);
        if (beat) beatController.scrollToBeat(beat.index);
        focusHotspot(entry.section, entry.look, entry.el);
        setActiveAnnotation(entry);
      });
      stripEl.appendChild(btn);
    });
  }

  function rebuildCleanGeometry(geo) {
    if (!geo?.attributes?.position) return geo;
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const fresh = new THREE.BufferGeometry();
    const posArr = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      posArr[i * 3] = pos.getX(i);
      posArr[i * 3 + 1] = pos.getY(i);
      posArr[i * 3 + 2] = pos.getZ(i);
    }
    fresh.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    if (nor) {
      const norArr = new Float32Array(nor.count * 3);
      for (let i = 0; i < nor.count; i++) {
        norArr[i * 3] = nor.getX(i);
        norArr[i * 3 + 1] = nor.getY(i);
        norArr[i * 3 + 2] = nor.getZ(i);
      }
      fresh.setAttribute("normal", new THREE.BufferAttribute(norArr, 3));
    } else {
      fresh.computeVertexNormals();
    }
    if (geo.index) fresh.setIndex(geo.index.clone());
    fresh.computeVertexNormals();
    fresh.computeBoundingSphere();
    geo.dispose();
    return fresh;
  }

  let ready = false;
  let manualLock = false;
  /** @type {{ el: HTMLButtonElement, section: Element, look: object, world: THREE.Vector3, n: number, label: string, title: string, body: string }[]} */
  const hotspots = [];
  /** @type {{ mesh: THREE.Mesh, base: THREE.Vector3, dir: THREE.Vector3, dist: number }[]} */
  let explodeParts = [];
  let explodeScale = 0.28;
  let activeAnnotation = null;
  let beatController = null;
  let disposeAssembly = null;
  let assemblyActive = false;
  let activeBeatIndex = 0;

  function applyLightingProfile(beatIndex) {
    activeBeatIndex = beatIndex;
    const isHero = beatIndex === 0;

    if (themeKey === "iron-man" && isHero) {
      renderer.toneMappingExposure = theme.heroExposure ?? theme.exposure * 0.82;
      scene.backgroundIntensity = theme.heroBgIntensity ?? 0.38;
      scene.environmentIntensity = theme.heroEnvIntensity ?? 0.95;
      return;
    }

    renderer.toneMappingExposure = theme.exposure;
    scene.backgroundIntensity = theme.bgIntensity ?? 0.62;
    scene.environmentIntensity =
      theme.envIntensity ?? (modelSrc.includes("body") ? 1.5 : themeKey === "f1" ? 3.6 : 1.28);
  }
  const _explodeQuat = new THREE.Quaternion();
  const _explodeOffset = new THREE.Vector3();

  function fitModel(object) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Scale first, then center. Three applies T*R*S, so centering before
    // scale leaves large STL-origin meshes (e.g. body) hundreds of units off-camera.
    object.scale.setScalar(1.85 / maxDim);
    object.updateMatrixWorld(true);
    const scaled = new THREE.Box3().setFromObject(object);
    object.position.sub(scaled.getCenter(new THREE.Vector3()));

    object.updateMatrixWorld(true);
    const fitted = new THREE.Box3().setFromObject(object);
    modelSize = fitted.getSize(new THREE.Vector3());
    const fittedCenter = fitted.getCenter(new THREE.Vector3());
    object.position.y -= fittedCenter.y;
    // Lift slightly so feet sit on the contact disc, not through it
    object.position.y += 0.02;
    const floorY = -modelSize.y * 0.5;
    ground.position.y = floorY;
    ground.scale.setScalar(Math.max(modelSize.x, modelSize.z) * 0.55 + 0.6);

    const radius = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.5 || 0.9;
    const fovRad = THREE.MathUtils.degToRad(28);
    baseDistance = THREE.MathUtils.clamp((radius * 1.4) / Math.tan(fovRad / 2), 2.2, 7.5);

    if (themeKey === "watch") {
      look.elevation = 3;
      look.ty = 0;
      look.tx = 0.12;
      ground.visible = false;
    } else if (modelSize.x > modelSize.y * 1.35 || modelSize.z > modelSize.y * 1.35) {
      look.elevation = 14;
      look.ty = 0.12;
      look.tx = 0.22;
    }
  }

  function focusPoint(src) {
    return focus.set(src.tx * modelSize.x, src.ty * modelSize.y, src.tz * modelSize.z);
  }

  function applyCamera(immediate = false) {
    const src = immediate || motionOff ? look : lookSmooth;
    if (!immediate && !motionOff) {
      for (const k of Object.keys(look)) {
        lookSmooth[k] += (look[k] - lookSmooth[k]) * lerpSpeed;
      }
      pointer.tx += (pointer.x - pointer.tx) * 0.08;
      pointer.ty += (pointer.y - pointer.ty) * 0.08;
    }

    focusPoint(src);
    camera.fov = src.fov;
    camera.updateProjectionMatrix();
    const dist = baseDistance * src.zoom;
    const az = THREE.MathUtils.degToRad(src.azimuth);
    const el = THREE.MathUtils.degToRad(src.elevation);
    camPos.set(
      focus.x + Math.cos(el) * Math.sin(az) * dist,
      focus.y + Math.sin(el) * dist,
      focus.z + Math.cos(el) * Math.cos(az) * dist
    );
    // AT moveXY parallax
    if (!motionOff && !mobileLite) {
      camPos.x += pointer.tx * 0.28 * src.zoom;
      camPos.y += pointer.ty * 0.18 * src.zoom;
    }
    camera.position.copy(camPos);
    camera.lookAt(focus);

    dof.focus = camera.position.distanceTo(focus);
    const zoomT = THREE.MathUtils.clamp((1.05 - src.zoom) / 0.8, 0, 1);
    dof.amount = useDof ? THREE.MathUtils.lerp(0.06, 0.92, zoomT) : 0;

    if (useDof) {
      const uniforms = bokehPass.uniforms;
      uniforms["focus"].value = dof.focus;
      uniforms["aperture"].value = THREE.MathUtils.lerp(0.00004, 0.00038, dof.amount);
      uniforms["maxblur"].value = THREE.MathUtils.lerp(0.0015, 0.014, dof.amount);
    }
    if (dofBar instanceof HTMLElement) {
      dofBar.style.transform = `scaleX(${0.15 + dof.amount * 0.85})`;
    }
    if (dofLabel) {
      dofLabel.textContent = dof.amount > 0.55 ? "shallow · bokeh" : dof.amount > 0.3 ? "mid" : "deep";
    }
    if (!tick.dofLast || Math.abs(tick.dofLast - dof.amount) > 0.04) {
      tick.dofLast = dof.amount;
      root.dispatchEvent(new CustomEvent("stage:dof", { detail: { amount: dof.amount } }));
    }
  }

  function resize() {
    const wrap = canvas.parentElement;
    const w = wrap?.clientWidth || window.innerWidth;
    const h = wrap?.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    bokehPass.uniforms["aspect"].value = camera.aspect;
    applyCamera(true);
  }

  function updateHotspotPositions() {
    if (!hotspotsEl) return;
    const wrap = canvas.parentElement;
    const w = wrap?.clientWidth || 1;
    const h = wrap?.clientHeight || 1;
    // Design: only the active hotspot is visible (Sketchfab focuses one annotation)
    const active = hotspots.find((h) => h.el.classList.contains("is-active"));
    hotspots.forEach((hspot) => {
      proj.copy(hspot.world).project(camera);
      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      const behind = proj.z > 1;
      const show = active === hspot && !behind;
      hspot.el.style.left = `${x}px`;
      hspot.el.style.top = `${y}px`;
      hspot.el.style.opacity = show ? "1" : "0";
      hspot.el.style.pointerEvents = show ? "auto" : "none";
      hspot.el.setAttribute("aria-hidden", show ? "false" : "true");
    });
  }

  function tick() {
    requestAnimationFrame(tick);
    gradePass.uniforms.uTime.value = performance.now() * 0.001;
    if (!ready) {
      if (useComposer) composer.render();
      else renderer.render(scene, camera);
      return;
    }
    if (!manualLock && !motionOff && !assemblyActive) {
      pivot.rotation.y += theme.spin * motion.spinMul;
    }
    applyCamera(false);
    if (!assemblyActive) applyExplode();
    updateHotspotPositions();
    if (useComposer) composer.render();
    else renderer.render(scene, camera);
  }

  function parseLook(el) {
    const raw = el.getAttribute("data-look") || "28,8,1,0.15,0.08,0,28";
    const [azimuth, elevation, zoom, tx, ty, tz, fov] = raw.split(",").map(Number);
    return {
      azimuth: Number.isFinite(azimuth) ? azimuth : 28,
      elevation: Number.isFinite(elevation) ? elevation : 8,
      zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1,
      tx: Number.isFinite(tx) ? tx : 0.15,
      ty: Number.isFinite(ty) ? ty : 0.08,
      tz: Number.isFinite(tz) ? tz : 0,
      fov: Number.isFinite(fov) && fov > 5 ? fov : 28,
    };
  }

  function setupFeatureCards() {
    root.querySelectorAll(".feature-beat").forEach((section, i) => {
      const card = section.querySelector(".feature-card");
      if (!card) return;
      gsap.set(card, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 28 });
      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        end: "bottom 30%",
        onEnter: () =>
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", overwrite: true }),
        onEnterBack: () =>
          gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", overwrite: true }),
        onLeave: () => {
          if (i === 0) return;
          gsap.to(card, { autoAlpha: 0, y: -16, duration: 0.35, ease: "power2.in", overwrite: true });
        },
        onLeaveBack: () => {
          if (i === 0) return;
          gsap.to(card, { autoAlpha: 0, y: 16, duration: 0.35, ease: "power2.in", overwrite: true });
        },
      });
    });
  }

  function setupHotspots() {
    if (!hotspotsEl) return;
    hotspotsEl.innerHTML = "";
    hotspots.length = 0;

    const sections = [...root.querySelectorAll("[data-hotspot][data-look]")];
    sections.forEach((section) => {
      const raw = section.getAttribute("data-hotspot") || "";
      const [num, ...labelParts] = raw.split("|");
      const label = labelParts.join("|") || `Part ${num}`;
      const n = Number(num) || hotspots.length + 1;
      const lookCfg = parseLook(section);
      const note = parseNote(section);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot";
      btn.innerHTML = `<span class="hotspot__n">${String(n).padStart(2, "0")}</span><span class="hotspot__tip">${label}</span>`;
      btn.setAttribute("aria-label", `Focus ${label}`);
      hotspotsEl.appendChild(btn);

      const worldPt = new THREE.Vector3(
        lookCfg.tx * modelSize.x,
        lookCfg.ty * modelSize.y,
        lookCfg.tz * modelSize.z
      );

      const entry = {
        el: btn,
        section,
        look: lookCfg,
        world: worldPt,
        n,
        label,
        title: note.title,
        body: note.body,
      };

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        focusHotspot(section, lookCfg, btn);
        setActiveAnnotation(entry);
      });

      hotspots.push(entry);
    });
    setupAnnotationStrip();
  }

  function focusHotspot(section, lookCfg, btn) {
    manualLock = true;
    const beat = beatController?.beats.find((b) => b.section === section);
    const entry = hotspots.find((h) => h.el === btn) || beat?.hotspotEntry || null;
    if (entry) setActiveAnnotation(entry);

    if (beat) {
      beatController.scrollToBeat(beat.index);
      gsap.delayedCall(0.9, () => {
        manualLock = false;
      });
    } else {
      gsap.to(look, {
        ...lookCfg,
        duration: 1.25,
        ease: "power3.inOut",
        onComplete: () => {
          Object.assign(lookSmooth, look);
          manualLock = false;
        },
      });
    }
    motion.spinMul = 0;
  }

  function setupScroll() {
    setupFeatureCards();
    setupHotspots();

    beatController = createBeatController(root, {
      motionOff,
      getManualLock: () => manualLock,
      onScrub: ({ look: L, explode: ex, spin, beatIndex }) => {
        if (assemblyActive) return;
        applyLightingProfile(beatIndex ?? 0);
        Object.assign(look, L);
        explode.t = ex;
        motion.spinMul = spin;
      },
      onActiveBeat: onActiveBeat,
    });
    beatController.bindHotspots(hotspots);
    beatController.setupScrollTrigger();

    if (motionOff) applyCamera(true);

    // Intro assemble on live model when no frame sequence
    if (!assemblySequenceUrl && !motionOff) {
      explode.t = 0.28;
      explode.smooth = 0.28;
      gsap.to(explode, {
        t: 0,
        duration: 1.6,
        ease: "power3.out",
        delay: 0.12,
        onUpdate: () => {
          explode.smooth = explode.t;
        },
      });
    }

    gsap.from(pivot.position, { y: -0.35, duration: 1.6, ease: "power3.out" });
    gsap.from(pivot.scale, { x: 0.88, y: 0.88, z: 0.88, duration: 1.7, ease: "power3.out" });

    ScrollTrigger.refresh();
  }

  async function setupAssemblySequence() {
    if (!assemblySequenceUrl || !(assemblyCanvas instanceof HTMLCanvasElement)) return;
    const hero = root.querySelector(".feature-beat--hero");
    if (!hero) return;

    try {
      const sequence = await loadAssemblySequence(assemblySequenceUrl);
      disposeAssembly = bindAssemblyScroll({
        canvas: assemblyCanvas,
        heroSection: hero,
        webglCanvas: canvas,
        sequence,
        dimHero: themeKey === "iron-man",
        onVisibilityChange: (visible) => {
          assemblyActive = visible;
          if (!visible) {
            canvas.style.opacity = "1";
            applyLightingProfile(activeBeatIndex);
            explode.t = 0;
            explode.smooth = 0;
          }
        },
      });
      console.info("[ProductStage] assembly sequence loaded", assemblySequenceUrl);
    } catch (err) {
      console.warn("[ProductStage] no assembly sequence, using live explode", err.message);
      assemblyCanvas.style.display = "none";
    }
  }

  if (!motionOff && !mobileLite) {
    window.addEventListener(
      "pointermove",
      (e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true }
    );
  }

  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);

  const startLoad = () =>
    loader.load(
      modelSrc,
      (gltf) => {
        let meshCount = 0;
        gltf.scene.traverse((child) => {
          if (!child.isMesh) return;
          meshCount += 1;

          // Interleaved COLOR_0 from STL converters can break draws — rebuild clean geo
          if (child.geometry) {
            child.geometry = rebuildCleanGeometry(child.geometry);
          }

          const mats = Array.isArray(child.material) ? child.material : [child.material];
          const untextured = mats.every((m) => m && !m.map && !m.normalMap && !m.roughnessMap);

          if (untextured || isBodySculpture) {
            mats.forEach((m) => m?.dispose?.());
            child.material = isBodySculpture
              ? new THREE.MeshStandardMaterial({
                  // Brushed silver — metal needs mid albedo + low roughness to catch the HDRI
                  color: 0xb8c4d0,
                  metalness: 0.96,
                  roughness: 0.22,
                  envMapIntensity: 1.55,
                  emissive: new THREE.Color(0x000000),
                  emissiveIntensity: 0,
                  flatShading: false,
                  side: THREE.DoubleSide,
                  vertexColors: false,
                })
              : new THREE.MeshStandardMaterial({
                  color: 0xe8ecf2,
                  metalness: 0.2,
                  roughness: 0.5,
                  envMapIntensity: 1.15,
                  emissive: new THREE.Color(0x3a4250),
                  emissiveIntensity: 0.35,
                  flatShading: false,
                  side: THREE.DoubleSide,
                  vertexColors: false,
                });
            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = false;
            child.renderOrder = 2;
            return;
          }

          mats.forEach((mat) => {
            if (!mat) return;
            mat.side = THREE.DoubleSide;
            mat.vertexColors = false;
            if ("metalness" in mat && mat.metalness > 0.95) mat.metalness = 0.82;
            if ("roughness" in mat && mat.roughness < 0.08) mat.roughness = 0.18;
            if ("envMapIntensity" in mat) mat.envMapIntensity = themeKey === "f1" ? 3.05 : 1.45;
            if (themeKey === "f1" && mat.color) {
              mat.color.r = Math.min(1, mat.color.r * 1.14);
              mat.color.g = Math.min(1, mat.color.g * 1.14);
              mat.color.b = Math.min(1, mat.color.b * 1.14);
            }
            if (themeKey === "f1" && "roughness" in mat && mat.roughness > 0.35) {
              mat.roughness = Math.max(0.22, mat.roughness * 0.88);
            }
            mat.needsUpdate = true;
          });
        });

        if (isBodySculpture) {
          bokehPass.enabled = false;
          scene.fog = null;
          renderer.toneMappingExposure = 1.28;
          scene.environmentIntensity = 1.5;
        }

        fitModel(gltf.scene);
        buildExplodeParts(gltf.scene);
        pivot.add(gltf.scene);
        ready = true;
        applyExplode();
        if (loading) {
          loading.textContent = "Ready";
          loading.classList.add("is-done");
        }
        resize();
        setupScroll();
        setupAssemblySequence();
        console.info("[ProductStage] loaded", modelSrc, {
          meshes: meshCount,
          size: modelSize.toArray(),
          baseDistance,
        });
        root.dispatchEvent(new CustomEvent("stage:ready", { detail: { theme: themeKey } }));
      },
      (xhr) => {
        if (!loading) return;
        if (!xhr.total) {
          loading.textContent = `Loading model ${(xhr.loaded / 1e6).toFixed(1)} MB`;
          return;
        }
        loading.textContent = `Loading model ${Math.min(100, Math.round((xhr.loaded / xhr.total) * 100))}%`;
      },
      (err) => {
        console.error("Failed to load model", modelSrc, err);
        if (loading) loading.textContent = "Model failed to load — see console";
      }
    );

  Promise.resolve(MeshoptDecoder.ready).then(startLoad).catch(startLoad);

  window.addEventListener("resize", () => {
    resize();
    ScrollTrigger.refresh();
  });
  resize();
  tick();
}
