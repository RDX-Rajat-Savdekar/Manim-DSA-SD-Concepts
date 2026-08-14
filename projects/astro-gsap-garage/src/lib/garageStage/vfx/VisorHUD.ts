/**
 * VisorHUD VFX — compact targeting rings on the faceplate (billboarded to camera).
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity } from "../RigSockets";

export function createVisorHUD(_ctx: VfxContext): VfxSystem {
  let group: THREE.Group | null = null;
  let ring1: THREE.Mesh, ring2: THREE.Mesh;
  const _pos = new THREE.Vector3();
  const _camPos = new THREE.Vector3();

  return {
    init(ctx: VfxContext) {
      const color = 0x00f0ff;
      group = new THREE.Group();
      ctx.scene.add(group);

      // Tight rings — sit near the eyes, not a giant halo behind the torso
      const rg1 = new THREE.RingGeometry(0.045, 0.052, 48);
      const rm1 = new THREE.MeshBasicMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      ring1 = new THREE.Mesh(rg1, rm1);
      group.add(ring1);

      const rg2 = new THREE.RingGeometry(0.062, 0.066, 48);
      const rm2 = new THREE.MeshBasicMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      ring2 = new THREE.Mesh(rg2, rm2);
      group.add(ring2);

      for (let i = 0; i < 4; i++) {
        const tg = new THREE.PlaneGeometry(0.004, 0.018);
        const tm = new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 0.8,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const tick = new THREE.Mesh(tg, tm);
        const angle = (i * Math.PI) / 2;
        tick.position.set(Math.cos(angle) * 0.078, Math.sin(angle) * 0.078, 0);
        tick.rotation.z = angle;
        group.add(tick);
      }
      group.visible = false;
    },

    update(_dt: number, time: number, fx: FxConfig, ctx: VfxContext) {
      if (!group) return;
      const visible = fxIntensity(fx.headScan) > 0.05;
      group.visible = visible;
      if (!visible) return;

      ring1.rotation.z = time * 0.55;
      ring2.rotation.z = -time * 0.4;

      if (ctx.sockets?.has("visor")) {
        ctx.sockets.getWorld("visor", _pos);
        group.position.copy(_pos);
        // Billboard toward camera so HUD stays on the faceplate, not stuck to skull orientation
        if (ctx.camera) {
          ctx.camera.getWorldPosition(_camPos);
          group.lookAt(_camPos);
        }
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
