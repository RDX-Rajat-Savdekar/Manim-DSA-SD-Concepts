/**
 * GarageHud — film UI overlay: strip nav, hotspots, cards, schematics, particles, telemetry.
 */
import { gsap, ScrambleTextPlugin } from "../gsap";
import * as THREE from "three";
import { schematicForBeat, schematicLabel } from "./schematics";
import type { Beat, ThemeKey, ScrubPayload, Look } from "./types";

void ScrambleTextPlugin;

const TIGHT_BEATS = new Set([2, 3, 4, 6]);

export interface GarageHudOptions {
  root: HTMLElement;
  beats: Beat[];
  themeKey: ThemeKey;
  scrollToBeat: (i: number) => void;
  getProjection: (localNorm: THREE.Vector3) => { x: number; y: number } | null;
  motionOff: boolean;
}

export interface GarageHudApi {
  onActiveBeat(beat: Beat): void;
  onScrub(payload: ScrubPayload): void;
  onFrame(): void;
  destroy(): void;
}

export function createGarageHud({
  root, beats, themeKey, scrollToBeat, getProjection, motionOff,
}: GarageHudOptions): GarageHudApi {
  if (!(root instanceof HTMLElement)) {
    return { onActiveBeat() {}, onScrub() {}, onFrame() {}, destroy() {} };
  }

  const strip = root.querySelector("[data-garage3d-strip]") as HTMLElement | null;
  const hotspotsEl = root.querySelector("[data-garage3d-hotspots]") as HTMLElement | null;
  const card = root.querySelector("[data-garage3d-card]") as HTMLElement | null;
  const cardKicker = root.querySelector("[data-garage3d-card-kicker]") as HTMLElement | null;
  const cardTitle = root.querySelector("[data-garage3d-card-title]") as HTMLElement | null;
  const cardBody = root.querySelector("[data-garage3d-card-body]") as HTMLElement | null;
  const cardStats = root.querySelector("[data-garage3d-card-stats]") as HTMLElement | null;
  const schematic = root.querySelector("[data-garage3d-schematic]") as HTMLElement | null;
  const schematicImg = root.querySelector("[data-garage3d-schematic-img]") as HTMLImageElement | null;
  const schematicLabelEl = root.querySelector("[data-garage3d-schematic-label]") as HTMLElement | null;
  const rail = root.querySelector("[data-garage3d-rail]") as HTMLElement | null;
  const dofBar = root.querySelector("[data-garage3d-dof]") as HTMLElement | null;
  const dofLabel = root.querySelector("[data-garage3d-dof-label]") as HTMLElement | null;
  const scrambleEl = root.querySelector("[data-garage3d-scramble]") as HTMLElement | null;
  const teleEl = root.querySelector("[data-garage3d-tele]") as HTMLElement | null;
  const deltaEl = root.querySelector("[data-garage3d-delta]") as HTMLElement | null;
  const ersEl = root.querySelector("[data-garage3d-ers]") as HTMLElement | null;
  const swarm = root.querySelector("[data-garage3d-swarm]") as HTMLElement | null;

  const partBeats = beats.filter((b) => typeof b.id === "number");
  const hotspots: Array<{ el: HTMLButtonElement; beat: Beat; local: THREE.Vector3 }> = [];
  const proj = new THREE.Vector3();
  let activeBeat: Beat | null = beats[0] || null;
  let lastScramble = "";
  let lastSchematic = "";

  function buildStrip() {
    if (!strip) return;
    strip.innerHTML = "";
    partBeats.forEach((beat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "garage3d__strip-btn";
      btn.dataset.beatId = String(beat.id);
      btn.innerHTML = `<span>${String(beat.id).padStart(2, "0")}</span><small>${beat.label || "Part"}</small>`;
      btn.setAttribute("aria-label", `Jump to ${beat.label || beat.id}`);
      btn.addEventListener("click", (e) => { e.preventDefault(); scrollToBeat(beat.index); });
      strip.appendChild(btn);
    });
  }

  function buildHotspots() {
    if (!hotspotsEl) return;
    hotspotsEl.innerHTML = "";
    hotspots.length = 0;
    partBeats.forEach((beat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "garage3d__hotspot";
      btn.innerHTML = `<span>${String(beat.id).padStart(2, "0")}</span><small>${beat.label || ""}</small>`;
      btn.setAttribute("aria-label", `Focus ${beat.label || beat.id}`);
      btn.addEventListener("click", (e) => { e.preventDefault(); scrollToBeat(beat.index); });
      hotspotsEl.appendChild(btn);
      hotspots.push({ el: btn, beat, local: new THREE.Vector3(beat.look.tx, beat.look.ty, beat.look.tz) });
    });
  }

  function buildSwarm() {
    if (!swarm || motionOff) return;
    swarm.innerHTML = "";
    for (let i = 0; i < 22; i++) {
      const p = document.createElement("span");
      p.className = "garage3d__particle";
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      swarm.appendChild(p);
      gsap.fromTo(p, { opacity: 0, scale: 0.4 }, { opacity: 0.12 + Math.random() * 0.35, scale: 0.6 + Math.random() * 1.1, duration: 1.2, delay: Math.random() * 2, ease: "power2.out" });
      gsap.to(p, { y: `${-40 - Math.random() * 80}px`, x: `${(Math.random() - 0.5) * 60}px`, duration: 4 + Math.random() * 7, repeat: -1, yoyo: true, ease: "sine.inOut", delay: Math.random() * 2 });
    }
  }

  function setStripActive(beat: Beat | null) {
    if (!strip) return;
    const id = beat && typeof beat.id === "number" ? String(beat.id) : "";
    strip.querySelectorAll<HTMLElement>(".garage3d__strip-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.beatId === id);
    });
  }

  function setHotspotActive(beat: Beat | null) {
    const id = beat && typeof beat.id === "number" ? beat.id : null;
    hotspots.forEach((h) => { h.el.classList.toggle("is-active", h.beat.id === id); });
  }

  function isTight(beat: Beat | null, zoom?: number) {
    if (beat && typeof beat.id === "number" && TIGHT_BEATS.has(beat.id)) return true;
    return typeof zoom === "number" && zoom < 0.42;
  }

  function setLayout(beat: Beat | null, zoom?: number) {
    const tight = isTight(beat, zoom);
    const showCard = Boolean(beat?.title);
    root.classList.toggle("is-tight", tight);
    if (card) gsap.to(card, { autoAlpha: showCard ? 1 : 0, x: showCard ? 0 : -12, duration: 0.35, ease: "power2.out", overwrite: true });
    if (schematic) {
      const show = Boolean(beat) && (!tight || !showCard);
      gsap.to(schematic, { autoAlpha: show ? 1 : 0, y: show ? 0 : 8, duration: 0.35, ease: "power2.out", overwrite: true });
    }
  }

  function setSchematic(beat: Beat | null) {
    const src = schematicForBeat(themeKey, beat?.id ?? "hero");
    if (schematicLabelEl) schematicLabelEl.textContent = schematicLabel(themeKey, beat);
    if (!schematicImg) return;
    if (src === lastSchematic) return;
    lastSchematic = src;
    schematicImg.style.opacity = "0";
    schematicImg.onload = () => { gsap.to(schematicImg, { opacity: 1, duration: 0.35, ease: "power2.out" }); };
    schematicImg.src = src;
    schematicImg.alt = schematicLabel(themeKey, beat);
  }

  function setCard(beat: Beat | null) {
    if (!beat?.title) return;
    if (cardKicker) cardKicker.textContent = beat.kicker || beat.label || "";
    if (cardTitle) cardTitle.textContent = beat.title;
    if (cardBody) cardBody.textContent = beat.body || "";
    if (cardStats) cardStats.innerHTML = (beat.stats || []).map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join("");
  }

  function scrambleHud(beat: Beat | null) {
    const lines = themeKey === "iron-man"
      ? ["SUIT · ONLINE", "JARVIS · LOCK", "ARC · STABLE", "NANITES · FLOW", "MARK 85 · READY"]
      : ["DRS · AVAILABLE", "AMR23 · GREEN", "ERS · DEPLOY", "PIT WALL · LIVE", "SECTOR · HOT"];
    const idx = typeof beat?.id === "number" ? beat.id % lines.length : Math.floor(Math.random() * lines.length);
    const next = lines[idx];
    if (next === lastScramble) return;
    lastScramble = next;
    if (scrambleEl && !motionOff) {
      gsap.to(scrambleEl, { duration: 0.7, scrambleText: { text: next, chars: "01■□░▒▓", speed: 0.4 } });
    } else if (scrambleEl) {
      scrambleEl.textContent = next;
    }
    if (teleEl && !motionOff) {
      const tele = themeKey === "iron-man"
        ? (typeof beat?.id === "number" ? `SYSTEM · 0${beat.id}` : "SUIT · SCAN")
        : (typeof beat?.id === "number" ? `FOCUS · 0${beat.id}` : "PIT WALL · LIVE");
      gsap.to(teleEl, { duration: 0.55, scrambleText: { text: tele, chars: "ABCDEF0123456789", speed: 0.35 } });
    }
  }

  function onActiveBeat(beat: Beat) {
    activeBeat = beat;
    setStripActive(beat);
    setHotspotActive(beat);
    setCard(beat);
    setSchematic(beat);
    setLayout(beat, beat?.look?.zoom);
    scrambleHud(beat);
  }

  function onScrub({ progress = 0, look }: Partial<ScrubPayload>) {
    if (rail) rail.style.transform = `scaleY(${Math.max(0.06, progress)})`;
    if (look && dofBar) {
      const t = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.22, 1.15, 1, 0.12, look.zoom));
      dofBar.style.transform = `scaleX(${t})`;
      if (dofLabel) dofLabel.textContent = t > 0.65 ? "shallow" : t > 0.35 ? "mid" : "deep";
      setLayout(activeBeat, look.zoom);
    }
    if (deltaEl) {
      deltaEl.textContent = themeKey === "iron-man"
        ? (2.4 + progress * 5.6).toFixed(3)
        : (-0.12 - progress * 1.72).toFixed(3);
    }
    if (ersEl) ersEl.textContent = String(Math.round(18 + progress * 70));
  }

  function onFrame() {
    if (!hotspots.length || typeof getProjection !== "function") return;
    const activeId = activeBeat && typeof activeBeat.id === "number" ? activeBeat.id : null;
    hotspots.forEach((h) => {
      const show = h.beat.id === activeId;
      if (!show) { h.el.style.opacity = "0"; h.el.style.pointerEvents = "none"; return; }
      const screen = getProjection(h.local);
      if (!screen) { h.el.style.opacity = "0"; h.el.style.pointerEvents = "none"; return; }
      h.el.style.left = `${screen.x}px`;
      h.el.style.top = `${screen.y}px`;
      h.el.style.opacity = "1";
      h.el.style.pointerEvents = "auto";
    });
  }

  buildStrip();
  buildHotspots();
  buildSwarm();
  if (beats[0]) onActiveBeat(beats[0]);

  return {
    onActiveBeat,
    onScrub,
    onFrame,
    destroy() {
      if (swarm) gsap.killTweensOf(swarm.querySelectorAll(".garage3d__particle"));
    },
  };
}
