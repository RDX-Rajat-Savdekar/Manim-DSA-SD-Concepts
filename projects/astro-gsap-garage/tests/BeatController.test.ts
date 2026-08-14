import { describe, it, expect } from "vitest";
import { lerp, lerpLook, lerpFx } from "../src/lib/garageStage/BeatController";
import type { Look, FxConfig } from "../src/lib/garageStage/types";

describe("BeatController Math Helpers", () => {
  describe("lerp", () => {
    it("should interpolate numbers", () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe("lerpLook", () => {
    it("should interpolate all properties of Look", () => {
      const lookA: Look = { azimuth: 10, elevation: 20, zoom: 1, tx: 0, ty: 0, tz: 0, fov: 30 };
      const lookB: Look = { azimuth: 50, elevation: 40, zoom: 2, tx: 10, ty: 20, tz: 30, fov: 50 };

      const halfway = lerpLook(lookA, lookB, 0.5);
      expect(halfway.azimuth).toBe(30);
      expect(halfway.elevation).toBe(30);
      expect(halfway.zoom).toBe(1.5);
      expect(halfway.tx).toBe(5);
      expect(halfway.ty).toBe(10);
      expect(halfway.tz).toBe(15);
      expect(halfway.fov).toBe(40);
    });
  });

  describe("lerpFx", () => {
    it("should interpolate numbers but hold discrete clip/flags on beat A", () => {
      const fxA: FxConfig = { wheels: 0.2, clip: "idle", thrust: 0.5, unibeamLaser: false };
      const fxB: FxConfig = { wheels: 0.8, clip: "run", thrust: 1.5, unibeamLaser: true };

      const halfway = lerpFx(fxA, fxB, 0.5);
      expect(halfway.wheels).toBe(0.5);
      expect(halfway.thrust).toBe(1.0);
      // Clip must not jump ahead of the active UI beat mid-scroll
      expect(halfway.clip).toBe("idle");
      expect(halfway.unibeamLaser).toBe(false);

      const late = lerpFx(fxA, fxB, 0.95);
      expect(late.clip).toBe("idle");
      expect(late.unibeamLaser).toBe(false);

      const early = lerpFx(fxA, fxB, 0.2);
      expect(early.clip).toBe("idle");
    });
  });
});
