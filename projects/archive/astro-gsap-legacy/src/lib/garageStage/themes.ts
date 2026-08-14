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
    exposure: 0.78,
    envIntensity: 0.5,
    envMapIntensity: 0.85,
    hdri: "/hdri/studio_small_09_1k.hdr",
    spin: 0.0009,
    warm: 0,
    fogDensity: 0.018,
    ambient: 0.22,
    hemi: 0.28,
    keyInt: 0.95,
    fillInt: 0.38,
    rimInt: 0.55,
    frontInt: 0.28,
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
    hero: { kicker: "Mark 85 · Online", stats: [["Status", "Assemble"], ["AI", "JARVIS"]] },
    1: { kicker: "01 · Arc Reactor", stats: [["Core", "Vibranium"], ["Output", "Stable"]] },
    2: { kicker: "02 · Helmet HUD", stats: [["Targeting", "Active"], ["Threats", "Vector"]] },
    3: { kicker: "03 · Unibeam", stats: [["Mode", "Restrained"], ["Yield", "High"]] },
    4: { kicker: "04 · Repulsors", stats: [["Role", "Flight + beam"], ["Mount", "Palm"]] },
    5: { kicker: "05 · Boot thrusters", stats: [["Lift", "Primary"], ["Hover", "Yes"]] },
    6: { kicker: "06 · Shoulder pods", stats: [["Loadout", "Micro"], ["Role", "Area denial"]] },
    7: { kicker: "07 · Back thruster", stats: [["Axis", "Straight-line"], ["Boost", "Max"]] },
    8: { kicker: "08 · Nanotech", stats: [["Plates", "Flow / seal"], ["Command", "On voice"]] },
    outro: { kicker: "Mark 85", stats: [["State", "Sealed"], ["Next", "Flight"]] },
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
    hero: { clip: "idle", fx: "none", thrust: 0.05, eyeGlow: 0.5 },
    1: { clip: "idle", fx: "unibeam", thrust: 0.15, chestBlast: true, eyeGlow: 0.6 },
    2: { clip: "look", fx: "visor", thrust: 0.08, headScan: true, eyeGlow: 1.5 },
    3: { clip: "idle", fx: "unibeam", thrust: 0.4, unibeamLaser: true, eyeGlow: 1.0 },
    4: { clip: "repulse", fx: "repulsors", thrust: 0.85, handLaser: true, eyeGlow: 1.0 },
    5: { clip: "thrust", fx: "boots", thrust: 0.9, groundSpot: true },
    6: { clip: "look", fx: "repulsors", thrust: 0.35, shouldersLock: true },
    7: { clip: "thrust", fx: "boots", thrust: 1.2, backJetBlast: true, shake: 0.5 },
    8: { clip: "idle", fx: "visor", thrust: 0.15, naniteSweep: true },
    outro: { clip: "idle", fx: "none", thrust: 0.1, eyeGlow: 0.5 },
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
