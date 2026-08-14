/**
 * ErsLightning VFX — crackling electrical arcs around the F1 power unit.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createErsLightning(_ctx: VfxContext): VfxSystem {
  const maxLines = 3;
  let lines: Array<{ line: THREE.Line; pos: Float32Array; geo: THREE.BufferGeometry; mat: THREE.LineBasicMaterial }> = [];
  let visible = false;
  let scene: THREE.Scene;

  return {
    init(ctx: VfxContext) {
      scene = ctx.scene;
      const color = 0x00aaff;
      for (let i = 0; i < maxLines; i++) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(6 * 3);
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        lines.push({ line, pos, geo, mat });
      }
    },

    update(_dt: number, _time: number, fx: FxConfig, ctx: VfxContext) {
      const ersInt = typeof fx.ersLightning === "number" ? fx.ersLightning : (fx.ersLightning ? 1 : 0);
      visible = ersInt > 0.04;
      lines.forEach((l) => {
        l.line.visible = visible;
        l.mat.opacity = visible ? ersInt * 0.85 : 0;
      });

      if (!visible) return;

      const centerPos = new THREE.Vector3(0, 0.15, -0.35);
      ctx.pivot.localToWorld(centerPos);

      lines.forEach((l) => {
        const pts = l.pos;
        for (let k = 0; k < 6; k++) {
          const ratio = k / 5;
          const targetX = centerPos.x + (Math.random() - 0.5) * 0.5;
          const targetY = centerPos.y + (Math.random() - 0.5) * 0.4;
          const targetZ = centerPos.z + (Math.random() - 0.5) * 0.5;
          const jitter = k === 0 || k === 5 ? 0 : (Math.random() - 0.5) * 0.06;
          pts[k * 3] = THREE.MathUtils.lerp(centerPos.x, targetX, ratio) + jitter;
          pts[k * 3 + 1] = THREE.MathUtils.lerp(centerPos.y, targetY, ratio) + jitter;
          pts[k * 3 + 2] = THREE.MathUtils.lerp(centerPos.z, targetZ, ratio) + jitter;
        }
        l.geo.attributes.position.needsUpdate = true;
      });
    },

    dispose() {
      lines.forEach((l) => {
        scene?.remove(l.line);
        l.geo.dispose();
        l.mat.dispose();
      });
      lines = [];
    },
  };
}
