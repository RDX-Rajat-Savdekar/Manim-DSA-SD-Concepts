/**
 * ChestRingFX — expanding shockwave ring from the arc reactor (beat 1).
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity } from "../RigSockets";

export function createChestRingFX(_ctx: VfxContext): VfxSystem {
  let ring: THREE.Mesh | null = null;
  let mat: THREE.MeshBasicMaterial | null = null;
  const _pos = new THREE.Vector3();
  const _camPos = new THREE.Vector3();
  let pulse = 0;

  return {
    init(ctx: VfxContext) {
      const geo = new THREE.RingGeometry(0.06, 0.085, 48);
      mat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      ring = new THREE.Mesh(geo, mat);
      ring.visible = false;
      ctx.scene.add(ring);
    },

    update(dt: number, _time: number, fx: FxConfig, ctx: VfxContext) {
      if (!ring || !mat) return;
      const on = fxIntensity(fx.chestBlast);
      pulse += (on - pulse) * Math.min(1, dt * 6);
      const show = pulse > 0.04;
      ring.visible = show;
      if (!show) return;

      mat.opacity = pulse * 0.55;
      const scale = 1 + pulse * 2.0;
      ring.scale.set(scale, scale, 1);

      if (ctx.sockets?.has("unibeam")) {
        ctx.sockets.getWorld("unibeam", _pos);
        ring.position.copy(_pos);
        if (ctx.camera) {
          ctx.camera.getWorldPosition(_camPos);
          ring.lookAt(_camPos);
        }
      }
    },

    dispose() {
      if (!ring) return;
      ring.parent?.remove(ring);
      ring.geometry.dispose();
      mat?.dispose();
    },
  };
}
