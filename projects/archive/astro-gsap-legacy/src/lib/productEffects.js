import {
  gsap,
  ScrollTrigger,
  SplitText,
  ScrambleTextPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  Physics2DPlugin,
  CustomEase,
} from "../lib/gsap.js";

// Ensure tree-shaken named imports stay registered via central gsap.js
void ScrambleTextPlugin;
void DrawSVGPlugin;
void MotionPathPlugin;
void Physics2DPlugin;

CustomEase.create("watchTick", "M0,0 C0.2,0 0.1,1 1,1");

export function revealCopy(scope = document) {
  const titles = scope.querySelectorAll("[data-split]");
  titles.forEach((el) => {
    const split = SplitText.create(el, { type: "chars,words", charsClass: "char" });
    gsap.from(split.chars, {
      yPercent: 120,
      opacity: 0,
      rotateX: -40,
      stagger: 0.02,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });
  });

  scope.querySelectorAll("[data-fade]").forEach((el) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });
  });
}

export function scrambleOnEnter(selector, vars = {}) {
  document.querySelectorAll(selector).forEach((el) => {
    const finalText = el.dataset.scramble || el.textContent;
    ScrollTrigger.create({
      trigger: el,
      start: "top 75%",
      onEnter: () => {
        gsap.to(el, {
          duration: 1.1,
          scrambleText: {
            text: finalText,
            chars: vars.chars || "01<>/█▓▒░",
            speed: 0.4,
          },
        });
      },
    });
  });
}

export function animateCounters(selector = "[data-count]") {
  document.querySelectorAll(selector).forEach((el) => {
    const end = Number(el.dataset.count || 0);
    const decimals = Number(el.dataset.decimals || 0);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
      onUpdate: () => {
        el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`;
      },
    });
  });
}

export function drawSvgLines(selector = "[data-draw]") {
  document.querySelectorAll(selector).forEach((svg) => {
    const paths = svg.querySelectorAll("path, line, circle, polyline, polygon");
    gsap.set(paths, { drawSVG: "0%" });
    gsap.to(paths, {
      drawSVG: "100%",
      duration: 1.4,
      stagger: 0.08,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: svg,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  });
}

export function burstParticles(container, { color = "#f5b301", count = 28 } = {}) {
  if (!container) return;
  const bits = [];
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("span");
    bit.className = "fx-particle";
    bit.style.background = color;
    container.appendChild(bit);
    bits.push(bit);
  }
  gsap.set(bits, {
    x: 0,
    y: 0,
    scale: () => gsap.utils.random(0.3, 1.1),
    opacity: 1,
  });
  bits.forEach((bit) => {
    gsap.to(bit, {
      duration: gsap.utils.random(0.8, 1.6),
      physics2D: {
        velocity: gsap.utils.random(120, 420),
        angle: gsap.utils.random(200, 340),
        gravity: 500,
      },
      opacity: 0,
      ease: "power1.out",
    });
  });
  gsap.delayedCall(2, () => bits.forEach((b) => b.remove()));
}
