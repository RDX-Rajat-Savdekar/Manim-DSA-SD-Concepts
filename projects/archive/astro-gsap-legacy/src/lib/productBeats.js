import { gsap, ScrollTrigger } from "./gsap.js";

/**
 * Parse data-look attribute into camera params.
 */
export function parseLookAttr(el) {
  const raw = el.getAttribute("data-look") || "28,8,1,0.15,0.08,0,28";
  const [azimuth, elevation, zoom, tx, ty, tz, fov] = raw.split(",").map(Number);
  return {
    azimuth: Number.isFinite(azimuth) ? azimuth : 28,
    elevation: Number.isFinite(elevation) ? elevation : 8,
    zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1,
    tx: Number.isFinite(tx) ? tx : 0.15,
    ty: Number.isFinite(ty) ? ty : 0.08,
    tz: Number.isFinite(tz) ? tz : 0,
    fov: Number.isFinite(fov) && fov > 5 ? fov : 28,
  };
}

export function parseExplodeAttr(el) {
  const raw = el.getAttribute("data-explode");
  if (raw == null || raw === "") return 0;
  const v = Number(raw);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpLook(a, b, t) {
  return {
    azimuth: lerp(a.azimuth, b.azimuth, t),
    elevation: lerp(a.elevation, b.elevation, t),
    zoom: lerp(a.zoom, b.zoom, t),
    tx: lerp(a.tx, b.tx, t),
    ty: lerp(a.ty, b.ty, t),
    tz: lerp(a.tz, b.tz, t),
    fov: lerp(a.fov, b.fov, t),
  };
}

function docTop(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

/**
 * Ordered beats from DOM. Camera + active part both use document scroll Y —
 * never inferred from camera look values or uniform timeline progress.
 */
export function createBeatController(root, { getManualLock, onScrub, onActiveBeat, motionOff = false }) {
  const beats = [...root.querySelectorAll("[data-look]")].map((section, index) => ({
    index,
    section,
    look: parseLookAttr(section),
    explode: parseExplodeAttr(section),
    spin: Number(section.getAttribute("data-spin") || 0),
    n: (() => {
      const raw = section.getAttribute("data-hotspot") || "";
      const num = raw.split("|")[0];
      return num ? Number(num) : null;
    })(),
    hotspotEntry: null,
  }));

  /** Document Y where each beat begins */
  let snapYs = [];

  function refreshMetrics() {
    snapYs = beats.map((b) => docTop(b.section));
  }

  /**
   * @param {number} scrollY document scroll position
   */
  function resolveFromScrollY(scrollY) {
    refreshMetrics();
    const probe = scrollY + window.innerHeight * 0.38;

    if (probe <= snapYs[0]) return { beatIndex: 0, localT: 0 };

    for (let i = 0; i < beats.length; i++) {
      const top = snapYs[i];
      const nextTop =
        snapYs[i + 1] ?? top + beats[i].section.getBoundingClientRect().height;
      const span = Math.max(1, nextTop - top);

      if (probe < nextTop || i === beats.length - 1) {
        const localT = Math.min(1, Math.max(0, (probe - top) / span));
        return { beatIndex: i, localT };
      }
    }

    return { beatIndex: beats.length - 1, localT: 0 };
  }

  function scrollYToProgress(scrollY, st) {
    const span = Math.max(1, st.end - st.start);
    return Math.min(1, Math.max(0, (scrollY - st.start) / span));
  }

  function progressToScrollY(progress, st) {
    return st.start + progress * (st.end - st.start);
  }

  function emitScrub(beatIndex, localT) {
    const a = beats[beatIndex];
    const b = beats[Math.min(beatIndex + 1, beats.length - 1)];
    const t = beatIndex === beats.length - 1 ? 0 : localT;

    onScrub({
      look: lerpLook(a.look, b.look, t),
      explode: lerp(a.explode, b.explode, t),
      spin: lerp(a.spin, b.spin, t),
      beatIndex,
    });

    onActiveBeat(a);
  }

  let st = null;

  function bindHotspots(hotspots) {
    beats.forEach((beat) => {
      beat.hotspotEntry = beat.n == null ? null : hotspots.find((h) => h.n === beat.n) || null;
    });
  }

  function scrollToBeat(beatIndex) {
    refreshMetrics();
    const y = snapYs[beatIndex];
    if (!Number.isFinite(y)) return;
    gsap.to(window, {
      duration: 0.85,
      scrollTo: { y, offsetY: window.innerHeight * 0.12 },
      ease: "power2.inOut",
    });
  }

  function setupScrollTrigger() {
    refreshMetrics();
    if (st) st.kill();

    if (motionOff) {
      emitScrub(0, 0);
      return;
    }

    st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      invalidateOnRefresh: true,
      snap: {
        snapTo(progress, self) {
          const scrollY = progressToScrollY(progress, self);
          const { beatIndex } = resolveFromScrollY(scrollY);
          refreshMetrics();
          const targetY = snapYs[beatIndex];
          return scrollYToProgress(targetY, self);
        },
        duration: { min: 0.12, max: 0.38 },
        delay: 0.04,
        ease: "power1.inOut",
      },
      onUpdate(self) {
        if (getManualLock?.()) return;
        const scrollY = self.scroll();
        const { beatIndex, localT } = resolveFromScrollY(scrollY);
        emitScrub(beatIndex, localT);
      },
    });

    emitScrub(0, 0);
  }

  return {
    beats,
    bindHotspots,
    scrollToBeat,
    setupScrollTrigger,
    refreshMetrics,
    resolveFromScrollY,
  };
}
