import { describe, it, expect } from "vitest";
import { schematicForBeat, schematicLabel, F1_SCHEMATICS, IRON_SCHEMATICS } from "../src/lib/garageStage/schematics";
import type { Beat } from "../src/lib/garageStage/types";

describe("schematics mapping", () => {
  it("should return the correct SVG paths for F1 beats", () => {
    expect(schematicForBeat("f1", "hero")).toBe("/schematics/f1/car-side.svg");
    expect(schematicForBeat("f1", 1)).toBe("/schematics/f1/wing.svg");
    expect(schematicForBeat("f1", 8)).toBe("/schematics/f1/tyre.svg");
    expect(schematicForBeat("f1", "outro")).toBe("/schematics/f1/steering-wheel.svg");
  });

  it("should return the correct SVG paths for Iron Man beats", () => {
    expect(schematicForBeat("iron-man", "hero")).toBe("/schematics/iron-man/armor.svg");
    expect(schematicForBeat("iron-man", 1)).toBe("/schematics/iron-man/atom.svg");
    expect(schematicForBeat("iron-man", 8)).toBe("/schematics/iron-man/hand.svg");
    expect(schematicForBeat("iron-man", "outro")).toBe("/schematics/iron-man/scan.svg");
  });

  it("should fall back to hero schematic on invalid beat IDs", () => {
    expect(schematicForBeat("f1", 999)).toBe("/schematics/f1/car-side.svg");
    expect(schematicForBeat("iron-man", "unknown")).toBe("/schematics/iron-man/armor.svg");
  });

  it("should return a clean label using schematicLabel", () => {
    const mockBeat: Partial<Beat> = { id: 1, label: "Front wing" };
    expect(schematicLabel("f1", mockBeat as Beat)).toBe("01 · Front wing");

    const heroBeat: Partial<Beat> = { id: "hero" };
    expect(schematicLabel("f1", heroBeat as Beat)).toBe("AMR23 · Overview");
    expect(schematicLabel("iron-man", heroBeat as Beat)).toBe("Mark 85 · Scan");

    expect(schematicLabel("f1", null)).toBe("Schematic");
  });
});
