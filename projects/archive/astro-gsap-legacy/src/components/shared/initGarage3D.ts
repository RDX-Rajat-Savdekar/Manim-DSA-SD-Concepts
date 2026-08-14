/**
 * Lazy-init garage stage when the section approaches the viewport.
 */
import { ScrollTrigger } from "../../lib/gsap";
import { createGarageStage, normalizeBeats } from "../../lib/garageStage/index";
import { f1Annotations } from "../../lib/annotations/f1";
import { ironManAnnotations } from "../../lib/annotations/iron-man";
import type { ThemeKey } from "../../lib/garageStage/types";

const ANNOTATIONS: Record<string, typeof f1Annotations> = {
  f1: f1Annotations,
  "iron-man": ironManAnnotations,
};

export function initGarage3DSection(root: Document | HTMLElement = document) {
  const section = root.querySelector("[data-garage3d]") as HTMLElement | null;
  if (!section || section.dataset.boot === "1") {
    return { scrollToBeat() {} };
  }
  section.dataset.boot = "1";

  const canvas = section.querySelector("[data-garage3d-canvas]") as HTMLCanvasElement | null;
  const pinEl = section.querySelector("[data-garage3d-pin]") as HTMLElement | null;
  const loading = section.querySelector("[data-garage3d-loading]") as HTMLElement | null;
  const modelSrc = section.dataset.model || "";
  const animSrc = section.dataset.anims || null;
  const themeKey = (section.dataset.theme || "f1") as ThemeKey;
  const beats = normalizeBeats(ANNOTATIONS[themeKey] || ANNOTATIONS.f1, themeKey);

  let stageApi: ReturnType<typeof createGarageStage> | null = null;

  const boot = () => {
    if (stageApi || !(canvas instanceof HTMLCanvasElement) || !modelSrc) return;
    stageApi = createGarageStage({
      canvas, modelSrc, animSrc, themeKey, beats, pinEl,
      root: section,
      onReady() {
        loading?.classList.add("is-done");
        ScrollTrigger.refresh();
      },
    });

    // Wire up car model selectors
    const carBtns = section.querySelectorAll("[data-car-selector] .garage3d__car-btn");
    carBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLButtonElement;
        const path = target.dataset.modelPath;
        if (!path || !stageApi) return;

        carBtns.forEach((b) => b.classList.remove("is-active"));
        target.classList.add("is-active");

        stageApi.changeModel(path);
      });
    });
  };

  ScrollTrigger.create({
    trigger: section,
    start: "top bottom+=20%",
    once: true,
    onEnter: boot,
  });

  requestAnimationFrame(() => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.4) boot();
  });

  return {
    scrollToBeat(index: number) {
      boot();
      requestAnimationFrame(() => stageApi?.scrollToBeat(index));
    },
  };
}
