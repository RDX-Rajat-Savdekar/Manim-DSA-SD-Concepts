/**
 * ThrusterLight VFX — point light under Iron Man's feet.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createThrusterLight(_ctx: VfxContext): VfxSystem {
  let light: THREE.PointLight | null = null;
  let modelHeight = 1;

  return {
    init(ctx: VfxContext) {
      light = new THREE.PointLight(0xff6600, 0, 2.5);
      ctx.scene.add(light);
      modelHeight = ctx.modelSize.y;
    },

    update(_dt: number, _time: number, fx: FxConfig) {
      if (!light) return;
      const thrustVal = typeof fx.thrust === "number" ? fx.thrust : 0;
      light.intensity = thrustVal * 3.8;
      light.position.set(0, -modelHeight * 0.5 + 0.1, 0);
    },

    dispose() {
      if (light) light.parent?.remove(light);
    },
  };
}
