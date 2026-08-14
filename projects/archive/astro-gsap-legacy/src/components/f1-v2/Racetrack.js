import { gsap, MotionPathPlugin, ScrollTrigger, DrawSVGPlugin } from "../../lib/gsap.js";

void MotionPathPlugin;
void ScrollTrigger;
void DrawSVGPlugin;

/**
 * Pin the track panel in view; scroll progress drives cars along the path.
 */
export function initRacetrack() {
  const panel = document.querySelector("[data-f1-track-sticky]");
  const path = document.querySelector("[data-f1-racing-line]");
  const car = document.querySelector("[data-f1-car]");
  const speedEl = document.querySelector("[data-f1-speed]");
  const sectorEl = document.querySelector("[data-f1-sector]");
  const deltaEl = document.querySelector("[data-f1-delta]");
  const drs = document.querySelector("[data-f1-drs]");
  const mini = document.querySelector("[data-f1-mini-dot]");
  const wheels = gsap.utils.toArray("[data-f1-wheel]");
  const opps = [0, 1, 2].map((i) => document.querySelector(`[data-f1-opp="${i}"]`));
  if (!panel || !path || !car) return;

  let drsMul = 1;
  drs?.addEventListener("input", () => {
    drsMul = Number(drs.value) || 1;
  });

  gsap.set(path, { drawSVG: "0% 0%" });

  gsap.set(car, {
    motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 0, end: 0 },
  });
  opps.forEach((el, i) => {
    if (!el) return;
    const start = Math.max(0, 0.08 + i * 0.06);
    gsap.set(el, {
      motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start, end: start },
    });
  });

  const applyProgress = (raw) => {
    const t = Math.min(1, Math.max(0, raw * (0.85 + 0.15 * drsMul) * (0.7 + 0.3 * drsMul)));

    gsap.set(car, {
      motionPath: {
        path,
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: true,
        start: t,
        end: t,
      },
    });

    opps.forEach((el, i) => {
      if (!el) return;
      const lag = 0.1 + i * 0.07;
      const ot = Math.max(0, t - lag / drsMul);
      gsap.set(el, {
        motionPath: {
          path,
          align: path,
          alignOrigin: [0.5, 0.5],
          autoRotate: true,
          start: ot,
          end: ot,
        },
      });
    });

    gsap.set(path, { drawSVG: `0% ${t * 100}%` });

    const kmh = Math.round(t * 320 * drsMul);
    if (speedEl) speedEl.textContent = String(kmh);
    if (sectorEl) sectorEl.textContent = String(t < 0.33 ? 1 : t < 0.66 ? 2 : 3);
    if (deltaEl) {
      const d = (0.42 - t * 0.55).toFixed(3);
      deltaEl.textContent = `${d.startsWith("-") ? "" : "+"}${d}`;
    }

    const spin = t * 720 * drsMul;
    wheels.forEach((w) => gsap.set(w, { rotation: spin }));

    if (mini) {
      const miniPath = document.querySelector(".f1v2-minimap path");
      if (miniPath) {
        gsap.set(mini, {
          motionPath: {
            path: miniPath,
            align: miniPath,
            alignOrigin: [0.5, 0.5],
            start: t,
            end: t,
          },
        });
      }
    }
  };

  ScrollTrigger.create({
    trigger: panel,
    start: "top top+=72",
    end: "+=220%",
    pin: true,
    scrub: 0.65,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate(self) {
      applyProgress(self.progress);
    },
  });

  panel.querySelectorAll("[data-f1-stand]").forEach((el) => {
    const rate = Number(el.getAttribute("data-plx") || 0.2);
    gsap.fromTo(
      el,
      { y: 0 },
      {
        y: 28 * rate,
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          start: "top top+=72",
          end: "+=220%",
          scrub: true,
        },
      }
    );
  });
}
