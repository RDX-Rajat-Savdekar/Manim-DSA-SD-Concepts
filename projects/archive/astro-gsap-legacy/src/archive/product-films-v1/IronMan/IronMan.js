import {
  gsap,
  ScrambleTextPlugin,
  DrawSVGPlugin,
  Physics2DPlugin,
} from "../../../lib/gsap.js";
import {
  revealCopy,
  scrambleOnEnter,
  animateCounters,
  burstParticles,
} from "../../../lib/productEffects.js";
import { initHudChrome, initIronManHudMotion } from "../../../lib/hudChrome.js";

void ScrambleTextPlugin;
void DrawSVGPlugin;
void Physics2DPlugin;

export function initIronManFX() {
  revealCopy();
  initHudChrome();
  initIronManHudMotion();
  scrambleOnEnter("[data-hud-scramble]", { chars: "01█▓▒░<>/" });
  animateCounters();

  const status = document.querySelector("[data-hud-status]");
  if (status) {
    const lines = [
      "ARC REACTOR · STABLE",
      "REPULSOR ARRAY · ONLINE",
      "FLIGHT GYRO · LOCKED",
      "NANITES · READY",
      "UNIBEAM · CHARGED",
      "JARVIS · LISTENING",
    ];
    let i = 0;
    const cycle = () => {
      const live = document.querySelector(".product-stage__hud");
      const visible = live && Number(getComputedStyle(live).opacity) > 0.2;
      if (visible) {
        gsap.to(status, {
          duration: 0.85,
          scrambleText: { text: lines[i % lines.length], chars: "01█▓░", speed: 0.45 },
          onComplete: () => {
            i++;
            gsap.delayedCall(3.6, cycle);
          },
        });
      } else {
        gsap.delayedCall(1.2, cycle);
      }
    };
    cycle();
  }

  const pulse = document.querySelector(".reactor-pulse");
  if (pulse) {
    gsap.to(pulse, {
      scale: 1.35,
      opacity: 0,
      duration: 1.4,
      repeat: -1,
      ease: "power1.out",
    });
  }

  const sparkZone = document.querySelector("[data-sparks]");
  if (sparkZone) {
    const fire = () => burstParticles(sparkZone, { color: "#f5b301", count: 18 });
    gsap.timeline({
      scrollTrigger: {
        trigger: "#reactor",
        start: "top center",
        onEnter: fire,
        onEnterBack: fire,
      },
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
