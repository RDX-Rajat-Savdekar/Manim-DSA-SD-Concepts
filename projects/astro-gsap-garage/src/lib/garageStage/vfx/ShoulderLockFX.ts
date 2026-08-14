/**
 * ShoulderLockFX — targeting brackets near shoulder sockets (billboarded).
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity } from "../RigSockets";

function makeBracket(color: number) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.005), mat.clone());
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    bar.position.set(Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0);
    bar.rotation.z = a;
    g.add(bar);
  }
  const cross = new THREE.Mesh(new THREE.RingGeometry(0.016, 0.02, 16), mat);
  g.add(cross);
  g.visible = false;
  return g;
}

export function createShoulderLockFX(_ctx: VfxContext): VfxSystem {
  let left: THREE.Group | null = null;
  let right: THREE.Group | null = null;
  const _pos = new THREE.Vector3();
  const _camPos = new THREE.Vector3();

  return {
    init(ctx: VfxContext) {
      left = makeBracket(0xf5b301);
      right = makeBracket(0xf5b301);
      ctx.scene.add(left);
      ctx.scene.add(right);
    },

    update(_dt: number, time: number, fx: FxConfig, ctx: VfxContext) {
      const on = fxIntensity(fx.shouldersLock) > 0.05;
      if (left) left.visible = on;
      if (right) right.visible = on;
      if (!on || !ctx.sockets) return;

      const spin = time * 0.8;
      if (ctx.camera) ctx.camera.getWorldPosition(_camPos);

      if (left && ctx.sockets.has("shoulderL")) {
        ctx.sockets.getWorld("shoulderL", _pos);
        left.position.copy(_pos);
        if (ctx.camera) left.lookAt(_camPos);
        left.rotateZ(spin);
      }
      if (right && ctx.sockets.has("shoulderR")) {
        ctx.sockets.getWorld("shoulderR", _pos);
        right.position.copy(_pos);
        if (ctx.camera) right.lookAt(_camPos);
        right.rotateZ(-spin);
      }
    },

    dispose() {
      [left, right].forEach((g) => {
        if (!g) return;
        g.parent?.remove(g);
        g.traverse((c) => {
          if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
          const m = (c as THREE.Mesh).material;
          if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        });
      });
    },
  };
}
