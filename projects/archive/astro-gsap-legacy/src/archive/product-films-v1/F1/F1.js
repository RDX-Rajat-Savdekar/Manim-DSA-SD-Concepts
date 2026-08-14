import {
  gsap,
  ScrambleTextPlugin,
  MotionPathPlugin,
  DrawSVGPlugin,
} from "../../../lib/gsap.js";
import {
  revealCopy,
  scrambleOnEnter,
  animateCounters,
} from "../../../lib/productEffects.js";
import { initHudChrome, initF1HudMotion } from "../../../lib/hudChrome.js";

void ScrambleTextPlugin;
void MotionPathPlugin;
void DrawSVGPlugin;

export function initF1FX() {
  revealCopy();
  initHudChrome();
  initF1HudMotion();
  scrambleOnEnter("[data-hud-scramble]", { chars: "0123456789KM/H" });
  animateCounters();

  const tel = document.querySelector("[data-telemetry]");
  if (tel) {
    const frames = [
      "DRS · AVAILABLE",
      "TYRE · SOFT 42°C",
      "ERS · DEPLOY 78%",
      "BRAKE BAL · 54.2",
      "FLOOR · STABLE",
      "AMR23 · MODE RACE",
    ];
    let i = 0;
    const cycle = () => {
      const live = document.querySelector(".product-stage__hud");
      const visible = live && Number(getComputedStyle(live).opacity) > 0.2;
      if (visible) {
        gsap.to(tel, {
          duration: 0.75,
          scrambleText: { text: frames[i % frames.length], chars: "0123456789%°", speed: 0.5 },
          onComplete: () => {
            i++;
            gsap.delayedCall(3.2, cycle);
          },
        });
      } else {
        gsap.delayedCall(1.2, cycle);
      }
    };
    cycle();
  }

  const needle = document.querySelector("[data-speed-needle]");
  if (needle) {
    gsap.fromTo(
      needle,
      { rotate: -120 },
      {
        rotate: 95,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-product-stage]",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      }
    );
  }

  const path = document.querySelector("#aero-path");
  const swarm = document.querySelector("[data-aero-swarm]");
  if (path && swarm) {
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement("span");
      dot.className = "aero-dot";
      swarm.appendChild(dot);
      gsap.to(dot, {
        duration: gsap.utils.random(2.2, 4.2),
        repeat: -1,
        ease: "none",
        motionPath: {
          path: "#aero-path",
          align: "#aero-path",
          autoRotate: true,
          alignOrigin: [0.5, 0.5],
        },
        delay: i * 0.2,
      });
      gsap.fromTo(
        dot,
        { opacity: 0, scale: 0.4 },
        {
          opacity: 0.85,
          scale: 1,
          duration: 0.4,
          yoyo: true,
          repeat: -1,
          delay: i * 0.2,
        }
      );
    }
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
