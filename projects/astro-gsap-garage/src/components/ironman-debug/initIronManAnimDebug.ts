/**
 * Iron Man Mixamo + camera debug lab — clips, beat FX, and per-beat look tuner.
 */
import {
  createGarageStage,
  BEAT_FX,
  DEBUG_FRONT_LOOK,
  lookFromArray,
  normalizeBeats,
} from "../../lib/garageStage/index";
import { ironManAnnotations } from "../../lib/annotations/iron-man";
import type { FxConfig, Look } from "../../lib/garageStage/types";

const CLIP_LABELS: Record<string, string> = {
  idle: "Orc Idle",
  standing: "Standing",
  fight: "Fight",
  repulse: "Point / Repulse",
  thrust: "Flying",
  fireball: "Fireball",
  butterflytwirl: "Butterfly Twirl",
  flipkick: "Flip Kick",
  lowcrawl: "Low Crawl",
  falling: "Falling",
  quadpunch: "Quad Punch",
};

const BEAT_LABELS: Array<{ id: string; label: string }> = [
  { id: "hero", label: "0 Standing" },
  { id: "1", label: "1 Reactor" },
  { id: "2", label: "2 Combat HUD" },
  { id: "3", label: "3 Unibeam" },
  { id: "4", label: "4 Wall crawl" },
  { id: "5", label: "5 Butterfly" },
  { id: "6", label: "6 Hang time" },
  { id: "7", label: "7 Flight" },
  { id: "8", label: "8 Flip kick" },
  { id: "outro", label: "9 Outro" },
];

const LOOK_FIELDS: Array<{ key: keyof Look; label: string; min: number; max: number; step: number }> = [
  { key: "azimuth", label: "Azimuth", min: -180, max: 360, step: 1 },
  { key: "elevation", label: "Elevation", min: -20, max: 45, step: 0.5 },
  { key: "zoom", label: "Zoom", min: 0.25, max: 1.6, step: 0.01 },
  { key: "tx", label: "Focus X", min: -0.4, max: 0.4, step: 0.01 },
  { key: "ty", label: "Focus Y", min: -0.3, max: 0.5, step: 0.01 },
  { key: "tz", label: "Focus Z", min: -0.3, max: 0.3, step: 0.01 },
  { key: "fov", label: "FOV", min: 16, max: 45, step: 0.5 },
];

function labelFor(id: string) {
  return CLIP_LABELS[id] || id;
}

function lookToArray(look: Look): number[] {
  return [
    +look.azimuth.toFixed(1),
    +look.elevation.toFixed(1),
    +look.zoom.toFixed(2),
    +look.tx.toFixed(2),
    +look.ty.toFixed(2),
    +look.tz.toFixed(2),
    +look.fov.toFixed(1),
  ];
}

function formatLookLine(beatId: string, look: Look): string {
  const a = lookToArray(look);
  return `  // beat ${beatId}\n  look: [${a.join(", ")}],`;
}

export function initIronManAnimDebug(root: Document | HTMLElement = document) {
  const page = (root instanceof Document ? root : root.ownerDocument) || document;
  const canvas = page.querySelector("[data-anim-debug-canvas]") as HTMLCanvasElement | null;
  const statusEl = page.querySelector("[data-anim-debug-status]") as HTMLElement | null;
  const clipRow = page.querySelector("[data-anim-debug-clips]") as HTMLElement | null;
  const beatRow = page.querySelector("[data-anim-debug-beats]") as HTMLElement | null;
  const camFields = page.querySelector("[data-anim-debug-cam]") as HTMLElement | null;
  const camExport = page.querySelector("[data-anim-debug-export]") as HTMLTextAreaElement | null;
  const camCopyBtn = page.querySelector("[data-anim-debug-copy]") as HTMLButtonElement | null;
  const camResetBtn = page.querySelector("[data-anim-debug-reset]") as HTMLButtonElement | null;
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const beats = normalizeBeats(ironManAnnotations, "iron-man");
  const lookStore = new Map<string, Look>();
  for (const b of beats) {
    lookStore.set(String(b.id), { ...b.look });
  }

  let activeClip = "idle";
  let activeBeatId = "hero";
  let draft: Look = { ...(lookStore.get("hero") || DEBUG_FRONT_LOOK) };
  const sliders = new Map<keyof Look, { range: HTMLInputElement; value: HTMLElement }>();

  function setActive(row: HTMLElement | null, value: string) {
    row?.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.id === value);
    });
  }

  function buildButtons(
    row: HTMLElement | null,
    items: Array<{ id: string; label: string }>,
    onPick: (id: string) => void,
  ) {
    if (!row) return;
    row.innerHTML = "";
    for (const item of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.id = item.id;
      btn.textContent = item.label;
      btn.addEventListener("click", () => onPick(item.id));
      row.appendChild(btn);
    }
  }

  function refreshExport() {
    if (!camExport) return;
    const lines = BEAT_LABELS.map(({ id }) => {
      const look = lookStore.get(id) || DEBUG_FRONT_LOOK;
      return formatLookLine(id, look);
    });
    camExport.value = lines.join("\n");
  }

  function applyDraft(snap = true) {
    lookStore.set(activeBeatId, { ...draft });
    stage.setLook(draft, snap);
    for (const field of LOOK_FIELDS) {
      const ui = sliders.get(field.key);
      if (!ui) continue;
      const v = draft[field.key];
      ui.range.value = String(v);
      ui.value.textContent = Number(v).toFixed(field.step < 1 ? 2 : 1);
    }
    refreshExport();
  }

  function buildCameraPanel() {
    if (!camFields) return;
    camFields.innerHTML = "";
    sliders.clear();
    for (const field of LOOK_FIELDS) {
      const row = document.createElement("label");
      row.className = "anim-debug__slider";
      const title = document.createElement("span");
      title.textContent = field.label;
      const value = document.createElement("span");
      value.className = "anim-debug__slider-val";
      value.textContent = "0";
      const range = document.createElement("input");
      range.type = "range";
      range.min = String(field.min);
      range.max = String(field.max);
      range.step = String(field.step);
      range.addEventListener("input", () => {
        draft[field.key] = Number(range.value);
        applyDraft(true);
        if (statusEl) {
          statusEl.textContent = `Cam ${activeBeatId} · ${field.label} ${range.value}`;
        }
      });
      row.append(title, value, range);
      camFields.appendChild(row);
      sliders.set(field.key, { range, value });
    }
  }

  function pickBeat(id: string) {
    activeBeatId = id;
    const ironFx = BEAT_FX["iron-man"] || {};
    const fx = (ironFx[id] || { clip: "idle" }) as FxConfig;
    activeClip = String(fx.clip || "idle");
    draft = { ...(lookStore.get(id) || lookFromArray()) };
    stage.setFx(fx);
    applyDraft(true);
    setActive(beatRow, id);
    setActive(clipRow, activeClip);
    if (statusEl) {
      const rev = fx.clipReverse ? " (reverse)" : "";
      statusEl.textContent = `Beat ${id} → ${activeClip}${rev} · tune camera below`;
    }
  }

  const stage = createGarageStage({
    canvas,
    modelSrc: "/models/iron-man-rigged.glb",
    animSrc: "/models/mixamo-anims.glb",
    themeKey: "iron-man",
    beats: [],
    root: canvas.parentElement,
    debug: { staticLook: DEBUG_FRONT_LOOK },
    sameMixamoSkeleton: false,
    onReady({ hasClips, clips }) {
      const list = (clips?.length ? clips : stage.listClips()).filter((id) => id !== "look");
      buildButtons(
        clipRow,
        list.map((id) => ({ id, label: labelFor(id) })),
        (id) => {
          activeClip = id;
          stage.playClip(id);
          setActive(clipRow, id);
          setActive(beatRow, "");
          if (statusEl) statusEl.textContent = `Playing clip: ${id}`;
        },
      );
      buildCameraPanel();
      pickBeat("hero");
      setActive(clipRow, activeClip);
      if (statusEl) {
        statusEl.textContent = hasClips
          ? `Ready (${list.length} clips) — pick a beat, tune camera, copy look arrays`
          : "No clips loaded — run npm run mixamo:character";
      }
    },
  });

  buildButtons(beatRow, BEAT_LABELS, pickBeat);

  camCopyBtn?.addEventListener("click", async () => {
    refreshExport();
    const text = camExport?.value || "";
    try {
      await navigator.clipboard.writeText(text);
      if (statusEl) statusEl.textContent = "Copied look arrays — paste into iron-man.ts";
    } catch {
      camExport?.select();
      if (statusEl) statusEl.textContent = "Select + copy the export box manually";
    }
  });

  camResetBtn?.addEventListener("click", () => {
    const beat = beats.find((b) => String(b.id) === activeBeatId);
    if (!beat) return;
    draft = { ...beat.look };
    applyDraft(true);
    if (statusEl) statusEl.textContent = `Reset camera for beat ${activeBeatId}`;
  });

  return stage;
}
