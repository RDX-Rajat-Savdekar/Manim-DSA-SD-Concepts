/**
 * SteeringHolo VFX — rev meter hologram above cockpit.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

export function createSteeringHolo(_ctx: VfxContext): VfxSystem {
  let group: THREE.Group | null = null;
  let arcMat: THREE.MeshBasicMaterial | null = null;
  let dots: THREE.MeshBasicMaterial[] = [];

  return {
    init(ctx: VfxContext) {
      const color = 0x00ff88;
      group = new THREE.Group();
      ctx.scene.add(group);

      const arcGeo = new THREE.RingGeometry(0.12, 0.128, 32, 1, 0, Math.PI);
      arcMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
      const arc = new THREE.Mesh(arcGeo, arcMat);
      arc.rotation.x = -Math.PI / 5;
      group.add(arc);

      dots = [];
      for (let i = 0; i < 8; i++) {
        const dotGeo = new THREE.CircleGeometry(0.007, 6);
        const dotMat = new THREE.MeshBasicMaterial({ color: i < 5 ? color : 0xff2d55, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        const angle = Math.PI - (i * Math.PI) / 7;
        dot.position.set(Math.cos(angle) * 0.09, Math.sin(angle) * 0.09, 0);
        group.add(dot);
        dots.push(dotMat);
      }
      group.visible = false;
      group.position.set(0, 0.15, 0.2);
    },

    update(_dt: number, time: number, fx: FxConfig) {
      if (!group || !arcMat) return;
      const holoInt = typeof fx.steeringHolo === "number" ? fx.steeringHolo : (fx.steeringHolo ? 1 : 0);
      if (holoInt < 0.04) { group.visible = false; arcMat.opacity = 0; dots.forEach((d) => (d.opacity = 0)); return; }
      group.visible = true;
      arcMat.opacity = holoInt * 0.65;
      const rev = 0.4 + 0.5 * Math.sin(time * 6.5);
      const activeCount = Math.floor(rev * dots.length);
      dots.forEach((d, idx) => { d.opacity = idx < activeCount ? 0.95 : 0.08; });
      group.position.y = 0.4 + Math.sin(time * 3.8) * 0.012;
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
