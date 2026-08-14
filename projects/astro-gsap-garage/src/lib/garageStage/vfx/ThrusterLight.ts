/**
 * ThrusterLight VFX — point light under boots / ground spot.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity } from "../RigSockets";

export function createThrusterLight(_ctx: VfxContext): VfxSystem {
  let light: THREE.PointLight | null = null;
  const _l = new THREE.Vector3();
  const _r = new THREE.Vector3();

  return {
    init(ctx: VfxContext) {
      light = new THREE.PointLight(0xff6600, 0, 2.5);
      ctx.scene.add(light);
    },

    update(_dt: number, _time: number, fx: FxConfig, ctx: VfxContext) {
      if (!light) return;
      const thrustVal = typeof fx.thrust === "number" ? fx.thrust : 0;
      const spot = fxIntensity(fx.groundSpot);
      light.intensity = Math.max(thrustVal, spot) * 3.8;

      const sockets = ctx.sockets;
      if (sockets?.has("bootL") && sockets.has("bootR")) {
        sockets.getWorld("bootL", _l);
        sockets.getWorld("bootR", _r);
        light.position.set(
          (_l.x + _r.x) * 0.5,
          Math.min(_l.y, _r.y) - 0.08,
          (_l.z + _r.z) * 0.5,
        );
      } else {
        light.position.set(0, -ctx.modelSize.y * 0.5 + 0.1, 0);
      }
    },

    dispose() {
      if (light) light.parent?.remove(light);
    },
  };
}
