import {
  gsap,
  SplitText,
  ScrambleTextPlugin,
  MorphSVGPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  ScrollTrigger,
  CustomWiggle,
} from "../../lib/gsap.js";

void SplitText;
void ScrambleTextPlugin;
void MorphSVGPlugin;
void DrawSVGPlugin;
void MotionPathPlugin;
void ScrollTrigger;
void CustomWiggle;

export function initIronManV2() {
  initHero();
  initAssembly();
  initSystems();
  initCore();
  initFlight();
}

function initHero() {
  const title = document.querySelector("[data-im-title]");
  const scramble = document.querySelector("[data-im-scramble]");
  const ring = document.querySelector("[data-im-morph]");
  const inner = document.querySelector("[data-im-morph-inner]");

  if (title) {
    const split = SplitText.create(title, { type: "chars" });
    gsap.from(split.chars, {
      y: 40,
      opacity: 0,
      stagger: 0.035,
      duration: 0.5,
      ease: "power3.out",
    });
  }

  if (scramble) {
    gsap.to(scramble, {
      duration: 1.35,
      delay: 0.3,
      scrambleText: {
        text: "JARVIS online · suit assembly primed",
        chars: "▪▫01#",
      },
    });
  }

  if (ring) {
    gsap.to(ring, {
      attr: { r: 34 },
      duration: 1.2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      repeatDelay: 0.4,
    });
  }
  if (inner) {
    gsap.to(inner, {
      attr: { r: 16 },
      duration: 0.9,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
}

function initAssembly() {
  const stage = document.querySelector("[data-im-assembly-stage]");
  const canvas = document.querySelector("[data-im-assembly-canvas]");
  const frameEl = document.querySelector("[data-im-assembly-frame]");
  if (!(stage instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  let images = [];
  let frameCount = 0;
  let frameIdx = 0;

  function resize() {
    const w = stage.clientWidth || 800;
    const h = Math.min(window.innerHeight * 0.56, 420);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    drawFrame(frameIdx);
  }

  function drawFrame(index) {
    const img = images[index];
    ctx.fillStyle = "#080505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!img?.complete) return;
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * 0.94;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    if (frameEl) {
      frameEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(frameCount).padStart(2, "0")}`;
    }
  }

  async function boot() {
    try {
      const { loadAssemblySequence } = await import("../../lib/assemblySequence.js");
      const sequence = await loadAssemblySequence("/sequences/iron-man");
      images = sequence.images;
      frameCount = sequence.frameCount;
      resize();
      drawFrame(0);

      ScrollTrigger.create({
        trigger: stage,
        start: "top top+=72",
        end: "+=170%",
        pin: true,
        scrub: 0.45,
        anticipatePin: 1,
        invalidateOnRefresh: true,
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
      ScrollTrigger.refresh();
    } catch (err) {
      console.warn("[iron-man] assembly sequence failed", err);
      stage.innerHTML =
        '<p style="padding:2rem;color:#aaa;font-family:monospace">Assembly sequence missing.</p>';
    }
  }

  boot();
}

function initSystems() {
  const cards = gsap.utils.toArray("[data-im-sys]");
  const scanner = document.querySelector("#hud-scanner");
  const hudStatus = document.querySelector("[data-hud-status]");

  if (!cards.length) return;

  function activateSystem(card) {
    const sysId = card.dataset.diagId;
    if (!sysId) return;

    // Toggle active classes on cards
    cards.forEach((c) => c.classList.remove("is-active"));
    card.classList.add("is-active");

    // Toggle highlighted classes on SVG elements
    const parts = document.querySelectorAll(".suit-part");
    parts.forEach((p) => p.classList.remove("is-highlighted"));

    const targetPart = document.querySelector(`#part-${sysId}`);
    if (targetPart) {
      targetPart.classList.add("is-highlighted");
    }

    // Trigger laser sweep animation
    if (scanner) {
      gsap.killTweensOf(scanner);
      gsap.fromTo(
        scanner,
        { attr: { y1: 40, y2: 40 }, opacity: 0 },
        {
          attr: { y1: 430, y2: 430 },
          opacity: 1,
          duration: 0.65,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.to(scanner, { opacity: 0, duration: 0.2 });
          },
        }
      );
    }

    // Update status text with scramble effect
    if (hudStatus) {
      gsap.to(hudStatus, {
        duration: 0.8,
        scrambleText: {
          text: `DIAG // ${sysId.toUpperCase()} // SCANNING`,
          chars: "01X▪▫#*",
          speed: 0.4,
        },
      });
    }
  }

  cards.forEach((card) => {
    // Click behavior
    card.addEventListener("click", () => activateSystem(card));

    // Scroll trigger entry
    ScrollTrigger.create({
      trigger: card,
      start: "top 75%",
      onEnter: () => {
        card.classList.add("is-on");
        if (card.dataset.diagId === "reactor") {
          activateSystem(card);
        }
      },
    });
  });
}

function initCore() {
  const section = document.querySelector("[data-im-core]");
  const orb = document.querySelector("[data-im-core-orb]");
  const schematic = document.querySelector("[data-im-core-schematic]");
  const pct = document.querySelector("[data-im-core-pct]");
  if (!section || !orb) return;

  CustomWiggle.create("coreWiggle", { wiggles: 10, type: "easeOut" });

  let wiggled = false;
  gsap.fromTo(
    orb,
    { scale: 0.72, filter: "brightness(0.75)" },
    {
      scale: 1.08,
      filter: "brightness(1.15)",
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top+=72",
        end: "+=120%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate(self) {
          if (pct) pct.textContent = String(Math.round(self.progress * 100));
          if (schematic) {
            gsap.set(schematic, { rotate: self.progress * 140 });
          }
          if (!wiggled && self.progress > 0.45 && self.progress < 0.55) {
            wiggled = true;
            gsap.fromTo(
              orb,
              { x: 0 },
              { x: 14, duration: 0.7, ease: "coreWiggle", yoyo: true, repeat: 1 }
            );
          }
        },
      },
    }
  );
}

function initFlight() {
  const section = document.querySelector("[data-im-flight]");
  const panel = document.querySelector("[data-im-flight-sticky]");
  const path = document.querySelector("[data-im-flight-path]");
  const draw = document.querySelector("[data-im-flight-draw]");
  const suit = document.querySelector("[data-im-suit]");
  const alt = document.querySelector("[data-im-alt]");
  const mach = document.querySelector("[data-im-mach]");
  if (!section || !panel || !path || !suit) return;

  // No pin — pinning here stacked over the Garage3D pin (beats 3–4 overlay).
  gsap.set(draw, { drawSVG: "0% 0%" });
  gsap.set(suit, {
    motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 0, end: 0 },
  });

  ScrollTrigger.create({
    trigger: section,
    start: "top 70%",
    end: "bottom 25%",
    scrub: 0.55,
    invalidateOnRefresh: true,
    onUpdate(self) {
      const t = self.progress;
      gsap.set(suit, {
        motionPath: {
          path,
          align: path,
          alignOrigin: [0.5, 0.5],
          autoRotate: true,
          start: t,
          end: t,
        },
      });
      gsap.set(draw, { drawSVG: `0% ${t * 100}%` });
      if (alt) alt.textContent = String(Math.round(t * 12400));
      if (mach) mach.textContent = (t * 1.35).toFixed(2);
    },
  });
}
