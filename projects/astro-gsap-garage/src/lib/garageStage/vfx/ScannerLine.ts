/**
 * ScannerLine VFX — laser sweep bar across the F1 nose.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createScannerLine(_ctx: VfxContext): VfxSystem {
  let mesh: THREE.Mesh | null = null;
  let mat: THREE.MeshBasicMaterial | null = null;

  return {
    init(ctx: VfxContext) {
      const geo = new THREE.BoxGeometry(1.5, 0.012, 0.012);
      mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.position.set(0, 0.2, 0);
      ctx.scene.add(mesh);
    },

    update(_dt: number, time: number, fx: FxConfig) {
      if (!mesh || !mat) return;
      const scanInt = typeof fx.scannerSweep === "number" ? fx.scannerSweep : (fx.scannerSweep ? 1 : 0);
      if (scanInt < 0.04) { mesh.visible = false; mat.opacity = 0; return; }
      mesh.visible = true;
      mat.opacity = scanInt * 0.88;
      const t = (Math.sin(time * 3.2) + 1) * 0.5;
      mesh.position.z = -1.2 + t * 2.4;
      mesh.position.y = 0.03 + Math.sin(time * 5) * 0.02;
    },

    dispose() {
      if (mesh) { mesh.parent?.remove(mesh); mesh.geometry.dispose(); }
      mat?.dispose();
    },
  };
}
