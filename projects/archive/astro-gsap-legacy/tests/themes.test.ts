import { describe, it, expect } from "vitest";
import { lookFromArray, normalizeBeats, GARAGE_THEMES } from "../src/lib/garageStage/themes";
import type { RawAnnotation } from "../src/lib/garageStage/types";

describe("lookFromArray", () => {
  it("should return default values when array is empty or undefined", () => {
    const result = lookFromArray();
    expect(result.azimuth).toBe(28);
    expect(result.elevation).toBe(8);
    expect(result.zoom).toBe(1);
    expect(result.tx).toBe(0.15);
    expect(result.ty).toBe(0.08);
    expect(result.tz).toBe(0);
    expect(result.fov).toBe(28);
  });

  it("should parse valid numbers properly", () => {
    const result = lookFromArray([45, 12, 1.2, 0.1, 0.2, 0.3, 35]);
    expect(result.azimuth).toBe(45);
    expect(result.elevation).toBe(12);
    expect(result.zoom).toBe(1.2);
    expect(result.tx).toBe(0.1);
    expect(result.ty).toBe(0.2);
    expect(result.tz).toBe(0.3);
    expect(result.fov).toBe(35);
  });

  it("should handle partial or invalid values with fallback values", () => {
    const result = lookFromArray([90, Number.NaN, 0, 0.5]);
    expect(result.azimuth).toBe(90);
    expect(result.elevation).toBe(8); // default fallback
    expect(result.zoom).toBe(1);      // 0 is invalid since it must be > 0, returns default fallback
    expect(result.tx).toBe(0.5);
    expect(result.ty).toBe(0.08);
  });
});

describe("normalizeBeats", () => {
  const mockAnnotations: RawAnnotation[] = [
    {
      id: "hero",
      look: [40, 12, 1.0, 0, 0, 0, 30],
      spin: 0.1,
      explode: 0,
      title: null,
      body: null,
    },
    {
      id: 1,
      label: "Front wing",
      look: [-55, 18, 0.5, 0, 0, 0, 17],
      spin: 0.2,
      explode: 0.1,
      title: "Title 1",
      body: "Body 1",
    },
  ];

  it("should merge raw annotations with theme HUD/FX data", () => {
    const result = normalizeBeats(mockAnnotations, "f1");
    expect(result).toHaveLength(2);
    expect(result[0].kicker).toBe("AMR23 · Grid");
    expect(result[0].stats).toEqual([["Status", "Assemble"], ["Mode", "Live"]]);
    expect(result[0].fx.wheels).toBe(1.1);

    expect(result[1].kicker).toBe("01 · Front wing");
    expect(result[1].title).toBe("Title 1");
    expect(result[1].body).toBe("Body 1");
    expect(result[1].look.azimuth).toBe(-55);
  });
});

describe("GARAGE_THEMES", () => {
  it("should contain f1 and iron-man themes with proper configurations", () => {
    expect(GARAGE_THEMES.f1).toBeDefined();
    expect(GARAGE_THEMES["iron-man"]).toBeDefined();
    expect(GARAGE_THEMES.f1.bg).toBe(0x050708);
    expect(GARAGE_THEMES["iron-man"].bg).toBe(0x080505);
  });
});
