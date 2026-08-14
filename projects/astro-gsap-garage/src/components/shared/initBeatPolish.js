/**
 * Shared visual polish — kinetic type, schematic draw-ins, ScrollSmoother.
 */
import { gsap, SplitText, ScrollTrigger, ScrollSmoother, DrawSVGPlugin } from "../../lib/gsap.js";

void SplitText;
void ScrollTrigger;
void ScrollSmoother;
void DrawSVGPlugin;

export function initScrollSmoother() {
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  if (ScrollSmoother.get()) return ScrollSmoother.get();

  const wrapper = document.querySelector("#smooth-wrapper");
  const content = document.querySelector("#smooth-content");
  if (!wrapper || !content) return null;

  return ScrollSmoother.create({
    wrapper,
    content,
    smooth: 1.05,
    effects: false,
    normalizeScroll: true,
  });
}

/** Staggered SplitText reveals for every [data-kinetic] headline. */
export function initKineticHeadlines(root = document) {
  const titles = gsap.utils.toArray("[data-kinetic]", root);
  titles.forEach((el) => {
    if (!(el instanceof HTMLElement) || el.dataset.kineticBoot === "1") return;
    el.dataset.kineticBoot = "1";
    try {
      const split = SplitText.create(el, { type: "chars,words", charsClass: "char", wordsClass: "word" });
      gsap.from(split.chars, {
        yPercent: 110,
        opacity: 0,
        rotate: 4,
        stagger: 0.018,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    } catch {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }
  });
}

/** DrawSVG / fade-in for schematic icons marked [data-schematic-draw]. */
export function initSchematicDraw(root = document) {
  const icons = gsap.utils.toArray("[data-schematic-draw]", root);
  icons.forEach((img, i) => {
    if (!(img instanceof HTMLElement)) return;
    gsap.from(img, {
      opacity: 0,
      scale: 0.82,
      y: 16,
      duration: 0.55,
      delay: i * 0.06,
      ease: "back.out(1.4)",
      scrollTrigger: {
        trigger: img,
        start: "top 90%",
        once: true,
      },
    });
  });

  const svgPaths = gsap.utils.toArray("[data-draw-svg] path, [data-draw-svg] circle, [data-draw-svg] line", root);
  if (svgPaths.length) {
    gsap.from(svgPaths, {
      drawSVG: "0%",
      duration: 1.1,
      stagger: 0.04,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: svgPaths[0].closest("svg") || svgPaths[0],
        start: "top 80%",
        once: true,
      },
    });
  }
}

/**
 * Scroll-scrub an assembly frame sequence into a canvas.
 * @param {string} selector - stage element with [data-seq-canvas] inside
 * @param {string} sequencePath - e.g. /sequences/f1-amr23
 */
export function initSequenceScrub(selector, sequencePath) {
  const stage = document.querySelector(selector);
  const canvas = stage?.querySelector("[data-seq-canvas]");
  const frameEl = stage?.querySelector("[data-seq-frame]");
  if (!(stage instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  let images = [];
  let frameCount = 0;
  let frameIdx = 0;

  function resize() {
    const w = stage.clientWidth || 800;
    const h = Math.round(w * (9 / 16));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    drawFrame(frameIdx);
  }

  function drawFrame(index) {
    const img = images[index];
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!img?.complete) return;
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    if (frameEl) {
      frameEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(frameCount).padStart(2, "0")}`;
    }
  }

  (async () => {
    try {
      const { loadAssemblySequence } = await import("../../lib/assemblySequence.js");
      const sequence = await loadAssemblySequence(sequencePath);
      images = sequence.images;
      frameCount = sequence.frameCount;
      resize();
      drawFrame(0);

      ScrollTrigger.create({
        trigger: stage,
        start: "top 70%",
        end: "bottom 30%",
        scrub: 0.4,
        onUpdate(self) {
          const next = Math.min(
            frameCount - 1,
            Math.max(0, Math.floor(self.progress * (frameCount - 1)))
          );
          if (next !== frameIdx) {
            frameIdx = next;
            drawFrame(frameIdx);
          }
        },
      });
      window.addEventListener("resize", resize);
    } catch (err) {
      console.warn("[beat-polish] sequence scrub failed", sequencePath, err);
    }
  })();
}

export function initBeatPolish() {
  initScrollSmoother();
  initKineticHeadlines();
  initSchematicDraw();
}
