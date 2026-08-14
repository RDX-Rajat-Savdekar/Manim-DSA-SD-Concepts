/**
 * WheelSpin VFX — find wheels in F1 model and spin them + tyre thermo.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

const WHEEL_NAME = /(wheel|tyre|tire|rim|hub|axle)/i;
const PREFERRED_WHEELS = new Set(["Object_10", "Object_27"]);

interface WheelEntry {
  mesh: THREE.Mesh;
  axis: "x" | "y" | "z";
}

function findWheels(root: THREE.Object3D): WheelEntry[] {
  const preferred: THREE.Mesh[] = [];
  const named: THREE.Mesh[] = [];
  const heuristic: THREE.Mesh[] = [];
  const rootBox = new THREE.Box3().setFromObject(root);
  const rootSize = rootBox.getSize(new THREE.Vector3());
  const modelLen = Math.max(rootSize.x, rootSize.y, rootSize.z) || 1;

  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const mesh = o as THREE.Mesh;
    if (PREFERRED_WHEELS.has(mesh.name)) { preferred.push(mesh); return; }
    if (WHEEL_NAME.test(mesh.name)) { named.push(mesh); return; }
    const box = new THREE.Box3().setFromObject(mesh);
    const s = box.getSize(new THREE.Vector3());
    const dims = [s.x, s.y, s.z];
    const max = Math.max(...dims);
    const mid = dims.slice().sort((a, b) => a - b)[1];
    const min = Math.min(...dims);
    const yzRatio = Math.min(s.y, s.z) / Math.max(s.y, s.z || 1);
    const isAxleSpan = s.x === max && yzRatio > 0.85 && s.y > modelLen * 0.05 && s.y < modelLen * 0.35 && s.x > modelLen * 0.3;
    const isDisc = min / (max || 1) < 0.35 && mid / (max || 1) > 0.7 && max < modelLen * 0.35 && max > modelLen * 0.04;
    if (isAxleSpan || isDisc) heuristic.push(mesh);
  });

  const meshes = preferred.length ? preferred : named.length ? named : heuristic;
  return meshes.map((mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const s = box.getSize(new THREE.Vector3());
    let axis: "x" | "y" | "z" = "x";
    if (s.x > s.y && Math.min(s.y, s.z) / Math.max(s.y, s.z || 1) > 0.8) axis = "x";
    else if (s.z >= s.x && s.z >= s.y) axis = "z";
    else if (s.y >= s.x && s.y >= s.z) axis = "y";
    return { mesh, axis };
  });
}

export function createWheelSpin(_ctx: VfxContext): VfxSystem {
  let wheels: WheelEntry[] = [];

  return {
    init(ctx: VfxContext) {
      wheels = findWheels(ctx.modelRoot);
    },

    update(dt: number, _time: number, fx: FxConfig) {
      const rpm = typeof fx.wheels === "number" ? fx.wheels : 0.4;
      if (rpm <= 0 || !wheels.length) return;
      const rad = rpm * Math.PI * 2 * dt * 2.8;
      for (const w of wheels) {
        w.mesh.rotation[w.axis] += rad;
      }

      // Tyre thermo
      const thermoVal = typeof fx.tyreThermo === "number" ? fx.tyreThermo : 0;
      wheels.forEach((w) => {
        const mats = Array.isArray(w.mesh.material) ? w.mesh.material : [w.mesh.material];
        mats.forEach((mat) => {
          if (mat && "emissive" in mat) {
            const stdMat = mat as THREE.MeshStandardMaterial;
            if (thermoVal > 0.05) {
              stdMat.emissive.setHex(0xff3300);
              stdMat.emissiveIntensity = thermoVal * 0.95;
            } else {
              stdMat.emissiveIntensity = 0;
            }
          }
        });
      });
    },

    dispose() {
      wheels = [];
    },
  };
}
