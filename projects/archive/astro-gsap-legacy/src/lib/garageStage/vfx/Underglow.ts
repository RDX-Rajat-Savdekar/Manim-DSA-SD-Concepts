/**
 * Underglow VFX — neon under-chassis light for F1.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createUnderglow(_ctx: VfxContext): VfxSystem {
  let light: THREE.PointLight | null = null;

  return {
    init(ctx: VfxContext) {
      light = new THREE.PointLight(0x00ff88, 0, 3.2);
      ctx.scene.add(light);
    },

    update(_dt: number, time: number, fx: FxConfig) {
      if (!light) return;
      const baseInt = typeof fx.frontUnderglow === "number" ? fx.frontUnderglow :
                      typeof fx.underglowPulse === "number" ? fx.underglowPulse :
                      (fx.frontUnderglow || fx.underglowPulse) ? 1 : 0;
      const pulseSpeed = fx.underglowPulse ? 6.0 : 0.0;
      const underInt = baseInt * (0.55 + 0.45 * Math.sin(time * pulseSpeed));
      light.intensity = underInt * 4.8;
    },

    dispose() {
      if (light) light.parent?.remove(light);
    },
  };
}
