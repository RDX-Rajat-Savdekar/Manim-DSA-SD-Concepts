/**
 * Beat → schematic SVG asset mapping.
 * Sources: Wikimedia Commons, Material Design Icons via Iconify, Lucide.
 */
import type { Beat, ThemeKey } from "./types";

const F1: Record<string, string> = {
  hero: "/schematics/f1/car-side.svg",
  1: "/schematics/f1/wing.svg",
  2: "/schematics/f1/nose.svg",
  3: "/schematics/f1/sidepod.svg",
  4: "/schematics/f1/halo.svg",
  5: "/schematics/f1/floor.svg",
  6: "/schematics/f1/rear-wing.svg",
  7: "/schematics/f1/engine.svg",
  8: "/schematics/f1/tyre.svg",
  outro: "/schematics/f1/steering-wheel.svg",
};

const IRON: Record<string, string> = {
  hero: "/schematics/iron-man/armor.svg",
  1: "/schematics/iron-man/atom.svg",
  2: "/schematics/iron-man/helmet.svg",
  3: "/schematics/iron-man/chest.svg",
  4: "/schematics/iron-man/shoulder.svg",
  5: "/schematics/iron-man/nano.svg",
  6: "/schematics/iron-man/boot.svg",
  7: "/schematics/iron-man/jet.svg",
  8: "/schematics/iron-man/hand.svg",
  outro: "/schematics/iron-man/scan.svg",
};

export function schematicForBeat(themeKey: ThemeKey, beatId: string | number): string {
  const map = themeKey === "iron-man" ? IRON : F1;
  return map[String(beatId)] || map.hero;
}

export function schematicLabel(themeKey: ThemeKey, beat?: Beat | null): string {
  if (!beat) return "Schematic";
  if (typeof beat.id === "number") {
    return `${String(beat.id).padStart(2, "0")} · ${beat.label || "Part"}`;
  }
  return themeKey === "iron-man" ? "Mark 85 · Scan" : "AMR23 · Overview";
}

// Export the maps for testing
export { F1 as F1_SCHEMATICS, IRON as IRON_SCHEMATICS };
