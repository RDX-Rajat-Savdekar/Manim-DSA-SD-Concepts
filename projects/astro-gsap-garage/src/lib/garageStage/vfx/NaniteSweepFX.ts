/**
 * NaniteSweepFX — magenta nanite particles + emissive sweep across armor (beat 8).
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity } from "../RigSockets";

const NANITE_COLOR = 0xc44dff;

interface MeshState {
  mesh: THREE.Mesh;
  mats: THREE.MeshStandardMaterial[];
  baseEmissive: THREE.Color[];
  baseIntensity: number[];
}

export function createNaniteSweepFX(_ctx: VfxContext): VfxSystem {
  const states: MeshState[] = [];
  let active = 0;
  let points: THREE.Points | null = null;
  let geo: THREE.BufferGeometry | null = null;
  let mat: THREE.PointsMaterial | null = null;
  let positions: Float32Array;
  let count = 0;
  const _center = new THREE.Vector3();
  const _size = new THREE.Vector3();
  const _box = new THREE.Box3();

  return {
    init(ctx: VfxContext) {
      ctx.modelRoot.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        const mesh = o as THREE.Mesh;
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          .filter((m): m is THREE.MeshStandardMaterial => Boolean(m) && "emissive" in m);
        if (!mats.length) return;
        const tag = `${mesh.name} ${mats.map((m) => m.name || "").join(" ")}`;
        if (!/gold|red|silver|arc_reactor|reactor/i.test(tag)) return;
        states.push({
          mesh,
          mats,
          baseEmissive: mats.map((m) => m.emissive.clone()),
          baseIntensity: mats.map((m) => m.emissiveIntensity ?? 0),
        });
      });

      count = ctx.mobileLite ? 64 : 140;
      positions = new Float32Array(count * 3);
      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      mat = new THREE.PointsMaterial({
        color: NANITE_COLOR,
        size: 0.028,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.visible = false;
      ctx.scene.add(points);
    },

    update(_dt: number, time: number, fx: FxConfig, ctx: VfxContext) {
      const on = fxIntensity(fx.naniteSweep);
      active += ((on > 0.05 ? 1 : 0) - active) * 0.12;

      if (active < 0.01) {
        states.forEach((s) => {
          s.mats.forEach((m, i) => {
            m.emissive.copy(s.baseEmissive[i]);
            m.emissiveIntensity = s.baseIntensity[i];
          });
        });
        if (mat) mat.opacity = 0;
        if (points) points.visible = false;
        return;
      }

      // Magenta / violet nanite glow (not cyan)
      const wave = (Math.sin(time * 3.2) * 0.5 + 0.5) * active;
      states.forEach((s, idx) => {
        const phase = (idx / Math.max(1, states.length)) * Math.PI * 2;
        const local = (Math.sin(time * 4 + phase) * 0.5 + 0.5) * wave;
        s.mats.forEach((m, i) => {
          m.emissive.setRGB(
            s.baseEmissive[i].r + local * 0.55,
            s.baseEmissive[i].g + local * 0.12,
            s.baseEmissive[i].b + local * 0.7,
          );
          m.emissiveIntensity = s.baseIntensity[i] + local * 1.35;
        });
      });

      // Swarm of tiny nanite sparks around the suit AABB
      if (!mat || !geo || !points) return;
      _box.setFromObject(ctx.modelRoot);
      _box.getCenter(_center);
      _box.getSize(_size);
      mat.opacity = active * 0.9;
      points.visible = true;

      for (let i = 0; i < count; i++) {
        const t = time * (1.8 + (i % 7) * 0.12) + i * 0.37;
        const orbit = 0.35 + (i % 5) * 0.08;
        const yWave = Math.sin(t * 1.4 + i) * _size.y * 0.42;
        const rx = Math.cos(t + i) * _size.x * orbit * 0.55;
        const rz = Math.sin(t * 0.9 + i * 1.3) * _size.z * orbit * 0.55;
        // Speckle / dissolve feel — snap some particles closer to surface
        const snap = (i % 3 === 0) ? 0.55 : 1;
        positions[i * 3] = _center.x + rx * snap;
        positions[i * 3 + 1] = _center.y + yWave * snap;
        positions[i * 3 + 2] = _center.z + rz * snap;
      }
      geo.attributes.position.needsUpdate = true;
    },

    dispose() {
      states.forEach((s) => {
        s.mats.forEach((m, i) => {
          m.emissive.copy(s.baseEmissive[i]);
          m.emissiveIntensity = s.baseIntensity[i];
        });
      });
      states.length = 0;
      if (points) points.parent?.remove(points);
      geo?.dispose();
      mat?.dispose();
    },
  };
}
