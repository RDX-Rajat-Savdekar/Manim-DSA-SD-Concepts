/**
 * Studio-first themes — solid bg, HDRI for reflections only.
 * Beat HUD copy, beat FX configs, and normalization utility.
 */
import type { Look, Beat, RawAnnotation, FxConfig, GarageTheme, ThemeKey } from "./types";

export const GARAGE_THEMES: Record<ThemeKey, GarageTheme> = {
  f1: {
    bg: 0x050708,
    key: 0xe8f0ff,
    fill: 0x6a9888,
    rim: 0xc04055,
    accent: 0xff2d55,
    exposure: 0.68,
    envIntensity: 0.4,
    envMapIntensity: 0.85,
    hdri: "/hdri/studio_small_09_1k.hdr",
    spin: 0.0009,
    warm: 0,
    fogDensity: 0.018,
    ambient: 0.12,
    hemi: 0.16,
    keyInt: 0.62,
    fillInt: 0.22,
    rimInt: 0.42,
    frontInt: 0,
  },
  "iron-man": {
    bg: 0x080505,
    key: 0xffd8b8,
    fill: 0x4a5888,
    rim: 0xc02020,
    accent: 0xf5b301,
    exposure: 0.62,
    envIntensity: 0.38,
    envMapIntensity: 0.7,
    hdri: "/hdri/studio_small_09_1k.hdr",
    spin: 0.0008,
    warm: 0.2,
    fogDensity: 0.022,
    ambient: 0.16,
    hemi: 0.2,
    keyInt: 0.7,
    fillInt: 0.28,
    rimInt: 0.55,
    frontInt: 0,
  },
};

/** Convert a raw look array to a typed Look object with safe defaults. */
export function lookFromArray(arr?: number[] | null): Look {
  const [azimuth, elevation, zoom, tx, ty, tz, fov] = arr || [];
  return {
    azimuth: Number.isFinite(azimuth) ? azimuth! : 28,
    elevation: Number.isFinite(elevation) ? elevation! : 8,
    zoom: Number.isFinite(zoom) && zoom! > 0 ? zoom! : 1,
    tx: Number.isFinite(tx) ? tx! : 0.15,
    ty: Number.isFinite(ty) ? ty! : 0.08,
    tz: Number.isFinite(tz) ? tz! : 0,
    fov: Number.isFinite(fov) && fov! > 5 ? fov! : 28,
  };
}

/** HUD copy / stats for each beat (not in the annotation look object). */
export const BEAT_HUD: Record<ThemeKey, Record<string, { kicker: string; stats: [string, string][] }>> = {
  f1: {
    hero: { kicker: "AMR23 · Grid", stats: [["Status", "Assemble"], ["Mode", "Live"]] },
    1: { kicker: "01 · Front wing", stats: [["Peak lateral", "5.2 g"], ["Elements", "Multi-plane"]] },
    2: { kicker: "02 · Nose", stats: [["Crash std", "FIA"], ["Cameras", "Halo / nose"]] },
    3: { kicker: "03 · Sidepods", stats: [["S1", "28.441"], ["S2", "34.902"], ["S3", "22.117"]] },
    4: { kicker: "04 · Halo", stats: [["Material", "Ti alloy"], ["Load test", "12+ tonne"]] },
    5: { kicker: "05 · Floor", stats: [["Downforce", "~60% floor"], ["Porpoising", "Managed"]] },
    6: { kicker: "06 · Rear wing", stats: [["DRS trap", "320 km/h"], ["Beam wing", "Present"]] },
    7: { kicker: "07 · Power unit", stats: [["System", "1000+ hp"], ["MGU-K", "120 kW"], ["Fuel", "E10"]] },
    8: { kicker: "08 · Tyres", stats: [["Compound", "Soft / Med / Hard"], ["Window", "°C critical"]] },
    outro: { kicker: "AMR23", stats: [["State", "Assembled"], ["Next", "Telemetry"]] },
  },
  "iron-man": {
    hero: { kicker: "Mark 85 · Standing", stats: [["Status", "Online"], ["AI", "FRIDAY"]] },
    1: { kicker: "01 · Arc Reactor", stats: [["Core", "Vibranium"], ["State", "Ignition"]] },
    2: { kicker: "02 · Combat HUD", stats: [["Targeting", "Active"], ["Stance", "Quad punch"]] },
    3: { kicker: "03 · Unibeam", stats: [["Mode", "Fireball"], ["Yield", "High"]] },
    4: { kicker: "04 · Wall crawl", stats: [["Mode", "Low crawl"], ["Imitate", "Web-line"]] },
    5: { kicker: "05 · Butterfly", stats: [["Mode", "Twirl"], ["Plates", "Flow"]] },
    6: { kicker: "06 · Hang time", stats: [["Clip", "Falling"], ["State", "Float"]] },
    7: { kicker: "07 · Flight", stats: [["Clip", "Flying"], ["Jets", "Boots + back"]] },
    8: { kicker: "08 · Flip kick", stats: [["Clip", "Flip kick"], ["Nanites", "Active"]] },
    outro: { kicker: "Mark 85", stats: [["State", "Standing"], ["Next", "Flight"]] },
  },
};

/** Scroll-driven motion FX per beat. */
export const BEAT_FX: Record<ThemeKey, Record<string, FxConfig>> = {
  f1: {
    hero: { wheels: 1.1, airflow: 0.7, focusStream: "frontWing", engineRumble: true },
    1: { wheels: 0.85, airflow: 1.35, focusStream: "frontWing", frontUnderglow: true },
    2: { wheels: 0.7, airflow: 0.9, focusStream: "frontWing", scannerSweep: true },
    3: { wheels: 0.9, airflow: 1.1, focusStream: "floor", sidepodHeat: true },
    4: { wheels: 0.55, airflow: 0.55, focusStream: "frontWing", steeringHolo: true },
    5: { wheels: 1.0, airflow: 1.4, focusStream: "floor", underglowPulse: true },
    6: { wheels: 1.05, airflow: 1.3, focusStream: "rear", drsOpen: true },
    7: { wheels: 1.15, airflow: 0.7, focusStream: "rear", engineGlow: true, ersLightning: true },
    8: { wheels: 1.6, airflow: 0.45, focusStream: "floor", tyreSmoke: true, tyreThermo: true },
    outro: { wheels: 1.25, airflow: 0.85, focusStream: "rear", engineRumble: true },
  },
  "iron-man": {
    hero: { clip: "standing", fx: "none", thrust: 0.04, eyeGlow: 0.45 },
    // No blue chest ring — camera does a tight chest push (annotation look) then pulls out to beat 2
    1: { clip: "idle", fx: "none", thrust: 0, eyeGlow: 0.85 },
    2: {
      clip: "quadpunch", fx: "visor", thrust: 0.15, headScan: true, eyeGlow: 1.4,
      shouldersLock: true,
    },
    // No thruster particles (gold residue) — beam only
    3: { clip: "fireball", fx: "none", thrust: 0, unibeamLaser: true, eyeGlow: 1.0 },
    4: { clip: "lowcrawl", fx: "none", thrust: 0.15, eyeGlow: 0.85 },
    5: { clip: "butterflytwirl", fx: "visor", thrust: 0.15, eyeGlow: 1.0 },
    6: { clip: "falling", fx: "boots", thrust: 0.55, groundSpot: true, eyeGlow: 0.75 },
    7: { clip: "thrust", fx: "boots", thrust: 1.2, backJetBlast: true, shake: 0.4, groundSpot: true, eyeGlow: 0.9 },
    8: { clip: "flipkick", fx: "boots", thrust: 0.45, naniteSweep: true, shake: 0.35, eyeGlow: 1.1 },
    outro: { clip: "standing", clipReverse: true, fx: "none", thrust: 0.04, eyeGlow: 0.4 },
  },
};

/** Merge raw annotations with theme HUD/FX data into normalized beats. */
export function normalizeBeats(annotations: RawAnnotation[], themeKey: ThemeKey = "f1"): Beat[] {
  const hudMap = BEAT_HUD[themeKey] || BEAT_HUD.f1;
  const fxMap = BEAT_FX[themeKey] || BEAT_FX.f1;
  return annotations.map((a, index) => {
    const hud = hudMap[String(a.id)] || {};
    const fx = fxMap[String(a.id)] || {};
    return {
      index,
      id: a.id,
      label: a.label || null,
      title: a.title || null,
      body: a.body || null,
      kicker: hud.kicker || (a.label ? String(a.label) : "Beat"),
      stats: hud.stats || [],
      look: lookFromArray(a.look),
      explode: typeof a.explode === "number" ? a.explode : 0,
      spin: typeof a.spin === "number" ? a.spin : 0,
      fx,
    };
  });
}
