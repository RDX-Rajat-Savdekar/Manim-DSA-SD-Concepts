/**
 * Shared HUD chrome behavior for product films.
 * Design: HUD and hotspots are contextual — not always-on clutter.
 */
import { gsap, ScrollTrigger, DrawSVGPlugin } from "../lib/gsap.js";

void DrawSVGPlugin;

/**
 * Fade HUD layers in/out by scroll beat.
 * - Hero / outro: chrome mostly off (product first)
 * - Feature beats: panels + live HUD on
 * - Hotspots: only the active part number visible
 */
export function initHudChrome(root = document.querySelector("[data-product-stage]")) {
  if (!root) return;

  const hud = root.querySelector(".product-stage__hud");
  const hotspots = root.querySelector("[data-hotspots]");
  const strip = root.querySelector("[data-annotation-strip]");
  const note = root.querySelector("[data-annotation-note]");
  const dof = root.querySelector("[data-dof-hud]");
  const panels = root.querySelectorAll(".hud-panel, .speedo, .hud-svg, .aero-svg, .reactor-pulse, [data-aero-swarm]");
  const rail = root.querySelector(".scroll-rail");

  gsap.set([hud, hotspots, dof, rail, strip].filter(Boolean), { autoAlpha: 0 });
  gsap.set(panels, { autoAlpha: 0 });

  const showChrome = (on) => {
    gsap.to([hud, rail].filter(Boolean), {
      autoAlpha: on ? 1 : 0,
      duration: 0.45,
      ease: "power2.out",
      overwrite: true,
    });
    gsap.to(panels, {
      autoAlpha: on ? 1 : 0,
      duration: 0.45,
      stagger: 0.04,
      ease: "power2.out",
      overwrite: true,
    });
    if (hotspots) {
      gsap.to(hotspots, {
        autoAlpha: on ? 1 : 0,
        duration: 0.35,
        overwrite: true,
      });
    }
    if (strip) {
      gsap.to(strip, {
        autoAlpha: on ? 1 : 0,
        duration: 0.35,
        overwrite: true,
      });
    }
    if (note && !on) {
      gsap.to(note, { autoAlpha: 0, duration: 0.25, overwrite: true });
    }
  };

  const beats = [...root.querySelectorAll(".feature-beat")];
  beats.forEach((section, i) => {
    const isHero = i === 0;
    const isOutro = i === beats.length - 1;
    const isFeature = !isHero && !isOutro;

    ScrollTrigger.create({
      trigger: section,
      start: "top 65%",
      end: "bottom 40%",
      onEnter: () => showChrome(isFeature),
      onEnterBack: () => showChrome(isFeature),
    });
  });

  // After model ready, briefly flash chrome then settle to hero-quiet
  root.addEventListener(
    "stage:ready",
    () => {
      showChrome(false);
      if (dof) gsap.set(dof, { autoAlpha: 0 });
    },
    { once: true }
  );

  // DOF meter only when zoomed in
  root.addEventListener("stage:dof", (e) => {
    const amount = e.detail?.amount ?? 0;
    if (!dof) return;
    gsap.to(dof, {
      autoAlpha: amount > 0.35 ? 0.9 : 0,
      duration: 0.3,
      overwrite: true,
    });
  });
}

/** Live targeting HUD — brackets breathe, scan line, reticle tracks pointer lightly */
export function initIronManHudMotion() {
  const svg = document.querySelector(".hud-svg");
  if (!svg) return;

  const paths = svg.querySelectorAll("path, circle, line, rect");
  gsap.set(paths, { drawSVG: "0% 0%" });
  gsap.to(paths, {
    drawSVG: "0% 100%",
    duration: 1.4,
    stagger: 0.08,
    ease: "power2.inOut",
    delay: 0.2,
  });

  const reticle = svg.querySelector("[data-reticle]");
  const scan = svg.querySelector("[data-scan]");
  const brackets = svg.querySelectorAll("[data-bracket]");

  if (reticle) {
    gsap.to(reticle, {
      rotation: 360,
      transformOrigin: "200px 160px",
      duration: 18,
      repeat: -1,
      ease: "none",
    });
    gsap.to(reticle, {
      scale: 1.08,
      transformOrigin: "200px 160px",
      duration: 1.1,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  if (scan) {
    gsap.fromTo(
      scan,
      { attr: { y1: 40, y2: 40 } },
      { attr: { y1: 280, y2: 280 }, duration: 2.4, repeat: -1, ease: "sine.inOut", yoyo: true }
    );
  }

  brackets.forEach((b, i) => {
    gsap.to(b, {
      opacity: 0.35,
      duration: 0.7 + i * 0.1,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: i * 0.15,
    });
  });

  // Pointer parallax on the whole SVG cluster
  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 18;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    gsap.to(svg, { x, y, duration: 0.6, ease: "power2.out", overwrite: "auto" });
  };
  window.addEventListener("pointermove", onMove, { passive: true });
}

/** F1 aero HUD — dashed paths flow, speedo glow, swarm already exists */
export function initF1HudMotion() {
  const svg = document.querySelector(".aero-svg");
  if (!svg) return;

  const paths = svg.querySelectorAll("path");
  paths.forEach((p, i) => {
    const len = p.getTotalLength?.() || 400;
    gsap.set(p, { strokeDasharray: `${len * 0.15} ${len * 0.08}`, strokeDashoffset: 0 });
    gsap.to(p, {
      strokeDashoffset: -len,
      duration: 3.2 + i * 0.4,
      repeat: -1,
      ease: "none",
    });
  });

  const speedo = document.querySelector(".speedo");
  if (speedo) {
    gsap.to(speedo, {
      filter: "drop-shadow(0 0 10px rgba(124,255,196,0.55))",
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 14;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    gsap.to(svg, { x, y, duration: 0.55, ease: "power2.out", overwrite: "auto" });
  };
  window.addEventListener("pointermove", onMove, { passive: true });
}
