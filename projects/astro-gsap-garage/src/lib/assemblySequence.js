import { ScrollTrigger } from "./gsap.js";

/**
 * Phase D — Apple-style scroll-scrubbed image sequence for assembly beats.
 * Frames live in public/sequences/{id}/ with a manifest.json.
 */

/**
 * @param {string} baseUrl e.g. "/sequences/f1-amr23"
 */
export async function loadAssemblySequence(baseUrl) {
  const res = await fetch(`${baseUrl}/manifest.json`);
  if (!res.ok) throw new Error(`No sequence manifest at ${baseUrl}`);
  const manifest = await res.json();
  const { frameCount, ext = "webp", pad = 4, prefix = "" } = manifest;

  const images = [];
  const loadOne = (i) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Frame ${i} missing`));
      const num = String(i).padStart(pad, "0");
      img.src = `${baseUrl}/${prefix}${num}.${ext}`;
    });

  images[0] = await loadOne(1);
  const rest = [];
  for (let i = 2; i <= frameCount; i++) {
    rest.push(loadOne(i).then((img) => ({ i: i - 1, img })));
  }
  Promise.allSettled(rest).then((results) => {
    results.forEach((r) => {
      if (r.status === "fulfilled") images[r.value.i] = r.value.img;
    });
  });

  return { manifest, images, frameCount };
}

/**
 * Bind assembly canvas to hero section scroll.
 */
export function bindAssemblyScroll({
  canvas,
  heroSection,
  webglCanvas,
  sequence,
  onVisibilityChange,
  dimHero = false,
}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  let frameIdx = 0;
  let active = false;

  function resize() {
    const wrap = canvas.parentElement;
    const w = wrap?.clientWidth || window.innerWidth;
    const h = wrap?.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    drawFrame(frameIdx);
  }

  function drawFrame(index) {
    const img = sequence.images[index];
    if (!img?.complete) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#07090c";
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.92;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  const st = ScrollTrigger.create({
    trigger: heroSection,
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate(self) {
      const idx = Math.min(
        sequence.frameCount - 1,
        Math.max(0, Math.round(self.progress * (sequence.frameCount - 1)))
      );
      if (idx !== frameIdx) {
        frameIdx = idx;
        drawFrame(frameIdx);
      }

      const show = self.progress < 0.92;
      if (show !== active) {
        active = show;
        canvas.style.opacity = show ? "1" : "0";
        webglCanvas.style.opacity = show ? "0" : "1";
        onVisibilityChange?.(show);
      }
    },
  });

  canvas.style.opacity = "1";
  webglCanvas.style.opacity = "0";
  if (dimHero) canvas.style.filter = "brightness(0.82) contrast(1.04)";
  active = true;

  resize();
  drawFrame(0);

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  return () => {
    st.kill();
    window.removeEventListener("resize", onResize);
  };
}
