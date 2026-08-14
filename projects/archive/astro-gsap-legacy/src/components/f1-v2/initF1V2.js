import {
  gsap,
  SplitText,
  ScrambleTextPlugin,
  MorphSVGPlugin,
  DrawSVGPlugin,
  Flip,
  ScrollTrigger,
  Physics2DPlugin,
  GSDevTools,
} from "../../lib/gsap.js";
import { initRacetrack } from "./Racetrack.js";

void SplitText;
void ScrambleTextPlugin;
void MorphSVGPlugin;
void DrawSVGPlugin;
void Flip;
void ScrollTrigger;
void Physics2DPlugin;
void GSDevTools;

const WING_CLOSED = "M140 220 L260 220 L250 240 L150 240 Z";
const WING_OPEN = "M130 200 L270 200 L255 248 L145 248 Z";

export function initF1V2({ skipGarage = false } = {}) {
  initHero();
  initGrid();
  initRacetrack();
  initAero();
  if (!skipGarage) initGarage();
  initTelemetry();

  if (import.meta.env.DEV) {
    const master = gsap.timeline({ paused: true });
    GSDevTools.create({ animation: master, id: "f1-v2", visibility: "hidden" });
  }
}

function initHero() {
  const title = document.querySelector("[data-f1-title]");
  const scramble = document.querySelector("[data-f1-scramble]");
  const morph = document.querySelector("[data-f1-morph]");

  if (title) {
    const split = SplitText.create(title, { type: "chars" });
    gsap.from(split.chars, {
      y: 50,
      opacity: 0,
      stagger: 0.04,
      duration: 0.55,
      ease: "power3.out",
      delay: 0.1,
    });
  }

  if (scramble) {
    gsap.to(scramble, {
      duration: 1.3,
      scrambleText: {
        text: "uplink locked · scroll to arm grid",
        chars: "01▪▫#*",
      },
      delay: 0.35,
    });
  }

  if (morph) {
    const shapes = [
      "M50 12 L88 88 H12 Z",
      "M20 50 Q50 12 80 50 Q50 88 20 50 Z",
      "M18 28 H82 V72 H18 Z",
    ];
    let i = 0;
    gsap.delayedCall(0.8, () => {
      const pulse = () => {
        i = (i + 1) % shapes.length;
        gsap.to(morph, { morphSVG: shapes[i], duration: 0.85, ease: "power2.inOut" });
      };
      pulse();
      gsap.delayedCall(2.2, pulse);
    });
  }
}

function initGrid() {
  const lights = gsap.utils.toArray("[data-f1-light]");
  const go = document.querySelector("[data-f1-go]");
  const section = document.querySelector("[data-f1-grid]");
  if (!section || !lights.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: "top 60%",
    once: true,
    onEnter() {
      const tl = gsap.timeline();
      lights.forEach((el, i) => {
        tl.call(() => el.classList.add("is-on"), null, i * 0.28);
      });
      tl.call(
        () => {
          lights.forEach((el) => el.classList.remove("is-on"));
        },
        null,
        lights.length * 0.28 + 0.4
      );
      if (go) {
        tl.fromTo(
          go,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" },
          lights.length * 0.28 + 0.45
        );
      }
    },
  });
}

function initAero() {
  const section = document.querySelector("[data-f1-aero]");
  const wing = document.querySelector("#drs-wing");
  const btn = document.querySelector("[data-f1-drs-toggle]");
  const layer = document.querySelector("[data-f1-particles]");
  const slider = document.querySelector("[data-wind-slider]");
  const label = document.querySelector("[data-wind-label]");
  const streamlines = gsap.utils.toArray(".streamline");

  if (!section) return;

  // Wind speed slider control
  slider?.addEventListener("input", (e) => {
    const val = Number(e.target.value) || 240;
    if (label) label.textContent = String(val);

    // Map speed (80 to 360) to animation duration (inverse mapping: higher speed = shorter duration)
    const duration = gsap.utils.mapRange(80, 360, 9.0, 1.8, val);
    streamlines.forEach((s) => {
      gsap.to(s, {
        style: { animationDuration: `${duration}s` },
        duration: 0.35,
        overwrite: "auto",
      });
    });
  });

  // DRS Wing Morph control
  let drsOpen = false;
  const WING_CLOSED = "M685 205 L722 205 L716 220 L691 220 Z";
  const WING_OPEN = "M685 198 L722 198 L722 203 L685 203 Z";

  btn?.addEventListener("click", () => {
    if (!wing) return;
    drsOpen = !drsOpen;
    btn.classList.toggle("is-active", drsOpen);

    // Morph wing geometry
    gsap.to(wing, {
      morphSVG: drsOpen ? WING_OPEN : WING_CLOSED,
      duration: 0.45,
      ease: "power2.inOut",
    });

    // Update streamline gradients to show drag changes
    streamlines.forEach((s) => {
      gsap.to(s, {
        attr: { stroke: drsOpen ? "url(#flow-grad-drs)" : "url(#flow-grad)" },
        duration: 0.45,
      });
    });

    if (layer) burstDirtyAir(layer, drsOpen);
  });
}

function burstDirtyAir(layer, drsOpen) {
  const count = drsOpen ? 28 : 12;
  const color = drsOpen ? "#ff2d55" : "#7cffc4";
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:${color};left:88%;top:50%;opacity:0.95;pointer-events:none;`;
    layer.appendChild(d);
    gsap.to(d, {
      duration: gsap.utils.random(0.8, 1.6),
      physics2D: {
        velocity: gsap.utils.random(120, 360),
        angle: gsap.utils.random(-30, 30), // Spray backwards out the rear
        gravity: gsap.utils.random(50, 150),
      },
      opacity: 0,
      onComplete: () => d.remove(),
    });
  }
}

function initGarage() {
  const strip = document.querySelector("[data-f1-garage-strip]");
  if (!strip) return;
  const chips = gsap.utils.toArray("[data-f1-chip]");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const state = Flip.getState("[data-f1-chip]");
      chips.forEach((c) => {
        c.classList.remove("is-feature");
        const body = c.querySelector("[data-f1-chip-body]");
        if (body) body.textContent = c.dataset.title || "";
      });
      chip.classList.add("is-feature");
      const body = chip.querySelector("[data-f1-chip-body]");
      if (body) body.textContent = chip.dataset.body || "";
      Flip.from(state, {
        duration: 0.55,
        ease: "power2.inOut",
        absolute: true,
        stagger: 0.03,
      });
    });
  });
}

function initTelemetry() {
  const section = document.querySelector("[data-f1-tele]");
  const ers = document.querySelector("[data-f1-ers]");
  const ersLabel = document.querySelector("[data-f1-ers-label]");
  const pit = document.querySelector("[data-f1-pit]");
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: "top 75%",
    once: true,
    onEnter() {
      document.querySelectorAll("[data-f1-count]").forEach((el) => {
        const to = Number(el.getAttribute("data-to") || 0);
        const decimals = Number(el.getAttribute("data-decimals") || 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = obj.v.toFixed(decimals);
          },
        });
      });
      if (pit) {
        gsap.to(pit, {
          duration: 1.1,
          scrambleText: { text: "BOX BOX — ERS mode race · push", chars: "▪▫01" },
        });
      }
    },
  });

  if (ers) {
    gsap.fromTo(
      ers,
      { width: "0%" },
      {
        width: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 40%",
          scrub: true,
          onUpdate(self) {
            if (ersLabel) ersLabel.textContent = String(Math.round(self.progress * 100));
          },
        },
      }
    );
  }
}
