/**
 * VisorHUD VFX — concentric glowing target rings for helmet scans.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createVisorHUD(_ctx: VfxContext): VfxSystem {
  let group: THREE.Group | null = null;
  let ring1: THREE.Mesh, ring2: THREE.Mesh;
  let head: THREE.Bone | null = null;

  return {
    init(ctx: VfxContext) {
      const color = 0x00f0ff;
      group = new THREE.Group();
      ctx.scene.add(group);

      const rg1 = new THREE.RingGeometry(0.12, 0.128, 32);
      const rm1 = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
      ring1 = new THREE.Mesh(rg1, rm1);
      group.add(ring1);

      const rg2 = new THREE.RingGeometry(0.15, 0.154, 32);
      const rm2 = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending });
      ring2 = new THREE.Mesh(rg2, rm2);
      group.add(ring2);

      for (let i = 0; i < 4; i++) {
        const tg = new THREE.PlaneGeometry(0.008, 0.05);
        const tm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending });
        const tick = new THREE.Mesh(tg, tm);
        const angle = (i * Math.PI) / 2;
        tick.position.set(Math.cos(angle) * 0.17, Math.sin(angle) * 0.17, 0);
        tick.rotation.z = angle;
        group.add(tick);
      }
      group.visible = false;

      // Find Head bone dynamically
      ctx.modelRoot.traverse((o) => {
        if (!(o as THREE.Bone).isBone) return;
        if (/Head(?!Top)/i.test(o.name) && !head) head = o as THREE.Bone;
      });
    },

    update(_dt: number, time: number, fx: FxConfig) {
      if (!group) return;
      const visible = typeof fx.headScan === "number" ? fx.headScan > 0.05 : !!fx.headScan;
      group.visible = visible;
      if (!visible) return;

      ring1.rotation.z = time * 0.55;
      ring2.rotation.z = -time * 0.4;

      if (head) {
        const pos = new THREE.Vector3(0, 0.06, 0.07);
        head.localToWorld(pos);
        group.position.copy(pos);

        const q = new THREE.Quaternion();
        head.getWorldQuaternion(q);
        group.quaternion.copy(q);
      }
    },

    dispose() {
      if (!group) return;
      group.parent?.remove(group);
      group.traverse((c) => {
        if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
        if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.Material).dispose();
      });
    },
  };
}
