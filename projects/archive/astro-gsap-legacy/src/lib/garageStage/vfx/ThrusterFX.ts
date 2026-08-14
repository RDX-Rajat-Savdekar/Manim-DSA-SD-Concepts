/**
 * ThrusterFX — boot/repulsor particle emitters for Iron Man.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createThrusterFX(_ctx: VfxContext): VfxSystem {
  let points: THREE.Points | null = null;
  let geo: THREE.BufferGeometry | null = null;
  let mat: THREE.PointsMaterial | null = null;
  let positions: Float32Array;
  const origins = [new THREE.Vector3(-0.12, 0, 0.05), new THREE.Vector3(0.12, 0, 0.05)];
  let strength = 0;
  let mode = "boots";
  let count = 0;

  return {
    init(ctx: VfxContext) {
      count = ctx.mobileLite ? 48 : 96;
      positions = new Float32Array(count * 3);
      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      mat = new THREE.PointsMaterial({
        color: ctx.theme.accent, size: 0.045,
        transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      ctx.scene.add(points);

      // Set anchor positions from model bounds
      const box = new THREE.Box3().setFromObject(ctx.modelRoot);
      const size = box.getSize(new THREE.Vector3());
      origins[0].set(box.min.x + size.x * 0.35, box.min.y, box.min.z + size.z * 0.45);
      origins[1].set(box.min.x + size.x * 0.65, box.min.y, box.min.z + size.z * 0.45);
    },

    update(_dt: number, _time: number, fx: FxConfig) {
      strength = THREE.MathUtils.clamp(typeof fx.thrust === "number" ? fx.thrust : 0, 0, 1.5);
      mode = typeof fx.fx === "string" ? fx.fx : "boots";

      if (!mat || !geo || !points) return;
      mat.opacity = strength * 0.85;
      points.visible = strength > 0.04 && mode !== "none";

      if (strength < 0.04 || mode === "none") return;

      const spread = mode === "repulsors" ? 0.2 : 0.08;
      const down = mode === "repulsors" ? -0.15 : -1;
      const now = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const o = origins[i % origins.length];
        const life = (now * (1.5 + strength) + i * 0.07) % 1;
        const a = i * 2.399;
        positions[i * 3] = o.x + Math.cos(a) * spread * strength * (0.4 + life);
        positions[i * 3 + 1] = o.y + life * down * (0.35 + strength * 0.55);
        positions[i * 3 + 2] = o.z + Math.sin(a) * spread * 0.5 * (0.4 + life);
      }
      geo.attributes.position.needsUpdate = true;
    },

    dispose() {
      if (points) points.parent?.remove(points);
      geo?.dispose();
      mat?.dispose();
    },
  };
}
