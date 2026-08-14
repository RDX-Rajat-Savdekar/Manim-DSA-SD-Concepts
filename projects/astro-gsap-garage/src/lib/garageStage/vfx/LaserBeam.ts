/**
 * LaserBeam VFX — unibeam + hand lasers. Unibeam only fires near the end of fireball.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity } from "../RigSockets";

function makeLaser(parent: THREE.Object3D, color: number) {
  const group = new THREE.Group();
  parent.add(group);

  const gOuter = new THREE.CylinderGeometry(0.035, 0.075, 4.0, 8);
  gOuter.rotateX(Math.PI / 2); gOuter.translate(0, 0, 2.0);
  const mOuter = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.Mesh(gOuter, mOuter));

  const gInner = new THREE.CylinderGeometry(0.012, 0.028, 4.0, 8);
  gInner.rotateX(Math.PI / 2); gInner.translate(0, 0, 2.0);
  const mInner = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.Mesh(gInner, mInner));

  group.visible = false;

  return {
    group, mOuter, mInner, gOuter, gInner,
    setIntensity(opacity: number, lengthScale = 1.0) {
      if (opacity < 0.04) { group.visible = false; mOuter.opacity = 0; mInner.opacity = 0; }
      else { group.visible = true; mOuter.opacity = opacity * 0.78; mInner.opacity = opacity * 0.95; group.scale.set(1, 1, lengthScale); }
    },
    dispose() {
      group.parent?.remove(group);
      gOuter.dispose(); mOuter.dispose(); gInner.dispose(); mInner.dispose();
    },
  };
}

/** Fireball Mixamo: beam on when hands come forward, then kill it. */
function fireballUnibeamGate(progress: number): number {
  // Earlier start (~55%), hold through the forward-hands pose, fade by end
  if (progress < 0.55) return 0;
  if (progress < 0.68) return (progress - 0.55) / 0.13;
  if (progress < 0.9) return 1;
  if (progress < 0.98) return 1 - (progress - 0.9) / 0.08;
  return 0;
}

export function createLaserBeam(_ctx: VfxContext): VfxSystem {
  let unibeam: ReturnType<typeof makeLaser> | null = null;
  let handLasers: ReturnType<typeof makeLaser>[] = [];
  const _pos = new THREE.Vector3();
  const _quat = new THREE.Quaternion();

  return {
    init(ctx: VfxContext) {
      const parent = ctx.scene;
      unibeam = makeLaser(parent, 0x00f0ff);
      handLasers = [makeLaser(parent, 0xff6644), makeLaser(parent, 0xff6644)];
    },

    update(_dt: number, _time: number, fx: FxConfig, ctx: VfxContext) {
      const sockets = ctx.sockets;
      const progress = typeof ctx.clipProgress === "number" ? ctx.clipProgress : 0;
      const clipName = ctx.clipName || "";

      let beamInt = fxIntensity(fx.unibeamLaser);
      if (clipName === "fireball" || fx.clip === "fireball") {
        beamInt *= fireballUnibeamGate(progress);
      }
      unibeam?.setIntensity(beamInt, 1.25);
      if (unibeam && beamInt > 0.05 && sockets?.has("unibeam")) {
        sockets.getWorld("unibeam", _pos);
        sockets.getWorldQuat("unibeam", _quat);
        unibeam.group.position.copy(_pos);
        unibeam.group.quaternion.copy(_quat);
      }

      // Hand beams only when explicitly flagged (not auto on quadpunch)
      const laserInt = fxIntensity(fx.handLaser);
      handLasers.forEach((l) => l.setIntensity(laserInt, 0.55));
      if (laserInt > 0.05 && sockets) {
        if (handLasers[0] && sockets.has("palmL")) {
          sockets.getWorld("palmL", _pos);
          sockets.getWorldQuat("palmL", _quat);
          handLasers[0].group.position.copy(_pos);
          handLasers[0].group.quaternion.copy(_quat);
        }
        if (handLasers[1] && sockets.has("palmR")) {
          sockets.getWorld("palmR", _pos);
          sockets.getWorldQuat("palmR", _quat);
          handLasers[1].group.position.copy(_pos);
          handLasers[1].group.quaternion.copy(_quat);
        }
      }
    },

    dispose() {
      unibeam?.dispose();
      handLasers.forEach((l) => l.dispose());
    },
  };
}
