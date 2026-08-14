import {
  gsap,
  DrawSVGPlugin,
  MotionPathPlugin,
  CustomEase,
  ScrambleTextPlugin,
} from "../../lib/gsap.js";
import {
  revealCopy,
  scrambleOnEnter,
  animateCounters,
  drawSvgLines,
} from "../../lib/productEffects.js";

void DrawSVGPlugin;
void MotionPathPlugin;
void ScrambleTextPlugin;
CustomEase.create("watchTick", "M0,0 C0.14,0 0.05,1 1,1");

export function initWatchFX() {
  revealCopy();
  scrambleOnEnter("[data-hud-scramble]", { chars: "0123456789:" });
  animateCounters();
  drawSvgLines(".watch-svg");

  // Second hand on SVG orbit
  const hand = document.querySelector("[data-second-hand]");
  if (hand) {
    gsap.to(hand, {
      duration: 60,
      repeat: -1,
      ease: "none",
      motionPath: {
        path: "#second-orbit",
        align: "#second-orbit",
        autoRotate: true,
        alignOrigin: [0.5, 1],
      },
    });
  }

  // Gear rotations
  gsap.to("[data-gear='a']", {
    rotate: 360,
    duration: 12,
    repeat: -1,
    ease: "none",
    transformOrigin: "50% 50%",
  });
  gsap.to("[data-gear='b']", {
    rotate: -360,
    duration: 8,
    repeat: -1,
    ease: "none",
    transformOrigin: "50% 50%",
  });
  gsap.to("[data-gear='c']", {
    rotate: 360,
    duration: 5.5,
    repeat: -1,
    ease: "none",
    transformOrigin: "50% 50%",
  });

  // Tick marks cascade
  const ticks = document.querySelectorAll("[data-tick]");
  if (ticks.length) {
    gsap.from(ticks, {
      scaleY: 0,
      opacity: 0,
      stagger: {
        each: 0.03,
        from: "center",
      },
      duration: 0.45,
      ease: "watchTick",
      scrollTrigger: {
        trigger: "#movement",
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  }

  // Luxury wordmark shimmer
  const shimmer = document.querySelector("[data-shimmer]");
  if (shimmer) {
    gsap.to(shimmer, {
      backgroundPosition: "200% center",
      duration: 2.8,
      ease: "power1.inOut",
      repeat: -1,
    });
  }

  // Soft tick sound-visual on the rail
  const beat = document.querySelector("[data-tick-beat]");
  if (beat) {
    gsap.to(beat, {
      scale: 1.5,
      opacity: 0,
      duration: 1,
      repeat: -1,
      ease: "power1.out",
    });
  }

  const rail = document.querySelector("[data-scroll-rail]");
  if (rail) {
    gsap.to(rail, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-product-stage]",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  }
}
