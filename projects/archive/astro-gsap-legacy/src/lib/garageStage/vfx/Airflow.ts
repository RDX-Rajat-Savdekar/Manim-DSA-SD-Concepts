/**
 * Airflow VFX — CFD-look particle streamlines + ribbon lines around the F1 car.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createAirflow(_ctx: VfxContext): VfxSystem {
  let points: THREE.Points | null = null;
  let geo: THREE.BufferGeometry | null = null;
  let mat: THREE.PointsMaterial | null = null;
  let positions: Float32Array;
  let velocities: Float32Array;
  let ages: Float32Array;
  let maxAge: Float32Array;
  let ribbons: Array<{ line: THREE.Line; pos: Float32Array; seed: number }> = [];
  const bounds = { min: new THREE.Vector3(-1, 0, -2), max: new THREE.Vector3(1, 1, 2) };
  let intensity = 0.35;
  let focus = "frontWing";
  let active = true;
  let count = 0;
  let streamCount = 0;
  let streamLen = 0;
  const _v = new THREE.Vector3();

  function resample(i: number) {
    const z0 = bounds.min.z, z1 = bounds.max.z;
    const x0 = bounds.min.x, x1 = bounds.max.x;
    const y0 = bounds.min.y, y1 = bounds.max.y;
    const alongZ = Math.abs(z1 - z0) >= Math.abs(x1 - x0);
    if (alongZ) {
      positions[i * 3] = THREE.MathUtils.lerp(x0, x1, Math.random());
      positions[i * 3 + 1] = THREE.MathUtils.lerp(y0, y1, Math.random() * 0.85);
      positions[i * 3 + 2] = z0 - (z1 - z0) * 0.08;
      velocities[i * 3] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 2] = 0.55 + Math.random() * 0.7;
    } else {
      positions[i * 3] = x0 - (x1 - x0) * 0.08;
      positions[i * 3 + 1] = THREE.MathUtils.lerp(y0, y1, Math.random() * 0.85);
      positions[i * 3 + 2] = THREE.MathUtils.lerp(z0, z1, Math.random());
      velocities[i * 3] = 0.55 + Math.random() * 0.7;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    ages[i] = 0;
    maxAge[i] = 1.2 + Math.random() * 1.8;
  }

  function flowField(x: number, y: number, z: number, out: THREE.Vector3) {
    const cx = (bounds.min.x + bounds.max.x) * 0.5;
    const cy = (bounds.min.y + bounds.max.y) * 0.45;
    out.set(0, 0, 1.1);
    out.y += Math.tanh(-(y - cy) * 2.2) * 0.35;
    out.x += Math.tanh((x - cx) * 1.8) * 0.25;
    if (focus === "frontWing") out.y -= 0.15;
    if (focus === "floor") out.y -= 0.35;
    if (focus === "rear") { out.z += 0.25; out.y += 0.1; }
    out.x += Math.sin(z * 3.2 + y * 2) * 0.08;
    out.y += Math.cos(x * 4.1 + z * 2.5) * 0.06;
    return out;
  }

  return {
    init(ctx: VfxContext) {
      const mobileLite = ctx.mobileLite;
      const accent = 0x7cffc4;
      const accent2 = ctx.theme.accent;

      count = mobileLite ? 280 : 640;
      streamCount = mobileLite ? 6 : 12;
      streamLen = mobileLite ? 18 : 28;

      positions = new Float32Array(count * 3);
      velocities = new Float32Array(count * 3);
      ages = new Float32Array(count);
      maxAge = new Float32Array(count);

      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      mat = new THREE.PointsMaterial({
        color: accent, size: mobileLite ? 0.055 : 0.045,
        transparent: true, opacity: 0.9, depthWrite: false,
        blending: THREE.AdditiveBlending, sizeAttenuation: true,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      ctx.scene.add(points);

      for (let s = 0; s < streamCount; s++) {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(streamLen * 3);
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const m = new THREE.LineBasicMaterial({
          color: s % 3 === 1 ? accent2 : accent,
          transparent: true, opacity: 0.35, depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(g, m);
        line.frustumCulled = false;
        ctx.scene.add(line);
        ribbons.push({ line, pos, seed: Math.random() * 100 });
      }

      // Set bounds from model
      const box = new THREE.Box3().setFromObject(ctx.modelRoot);
      const pad = box.getSize(new THREE.Vector3()).multiplyScalar(0.15);
      bounds.min.copy(box.min).sub(pad);
      bounds.max.copy(box.max).add(pad);
      bounds.min.y = Math.max(bounds.min.y, box.min.y - pad.y * 0.2);

      for (let i = 0; i < count; i++) resample(i);
    },

    update(dt: number, _time: number, fx: FxConfig) {
      intensity = typeof fx.airflow === "number" ? fx.airflow : 0.35;
      focus = (fx.focusStream as string) || "frontWing";

      if (!active || intensity < 0.02 || !points || !mat || !geo) return;

      mat.opacity = 0.25 + intensity * 0.55;
      ribbons.forEach((r, i) => {
        (r.line.material as THREE.LineBasicMaterial).opacity = 0.12 + intensity * 0.35 * (i % 2 === 0 ? 1 : 0.7);
      });

      const speed = 0.9 + intensity * 2.2;
      for (let i = 0; i < count; i++) {
        ages[i] += dt;
        if (ages[i] > maxAge[i]) { resample(i); continue; }
        const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
        flowField(x, y, z, _v);
        positions[i * 3] += (_v.x * speed + velocities[i * 3]) * dt;
        positions[i * 3 + 1] += (_v.y * speed + velocities[i * 3 + 1]) * dt;
        positions[i * 3 + 2] += (_v.z * speed + velocities[i * 3 + 2]) * dt;
        if (positions[i * 3 + 2] > bounds.max.z + (bounds.max.z - bounds.min.z) * 0.35 ||
            positions[i * 3 + 1] < bounds.min.y - 0.5) {
          resample(i);
        }
      }
      geo.attributes.position.needsUpdate = true;

      const spanZ = bounds.max.z - bounds.min.z;
      const t = performance.now() * 0.001;
      ribbons.forEach((r, si) => {
        let x = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, (si + 0.5) / streamCount) + Math.sin(t + r.seed) * 0.08;
        let y = THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, 0.25 + (si % 4) * 0.12);
        let z = bounds.min.z - spanZ * 0.05;
        for (let k = 0; k < streamLen; k++) {
          flowField(x, y, z, _v);
          r.pos[k * 3] = x; r.pos[k * 3 + 1] = y; r.pos[k * 3 + 2] = z;
          x += _v.x * 0.12 * (0.8 + intensity);
          y += _v.y * 0.12 * (0.8 + intensity);
          z += _v.z * 0.12 * (0.8 + intensity);
        }
        r.line.geometry.attributes.position.needsUpdate = true;
      });
    },

    dispose() {
      if (points) points.parent?.remove(points);
      geo?.dispose();
      mat?.dispose();
      ribbons.forEach((r) => {
        r.line.parent?.remove(r.line);
        r.line.geometry.dispose();
        (r.line.material as THREE.Material).dispose();
      });
      ribbons = [];
    },
  };
}
