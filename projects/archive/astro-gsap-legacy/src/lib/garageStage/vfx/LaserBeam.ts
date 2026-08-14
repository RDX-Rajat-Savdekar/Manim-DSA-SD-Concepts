/**
 * LaserBeam VFX — unibeam + repulsor laser cylinders.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

function makeLaser(scene: THREE.Scene, color: number) {
  const group = new THREE.Group();
  scene.add(group);

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
      scene.remove(group);
      gOuter.dispose(); mOuter.dispose(); gInner.dispose(); mInner.dispose();
    },
  };
}

export function createLaserBeam(_ctx: VfxContext): VfxSystem {
  let unibeam: ReturnType<typeof makeLaser> | null = null;
  let handLasers: ReturnType<typeof makeLaser>[] = [];
  let scene: THREE.Scene;
  let leftHand: THREE.Bone | null = null;
  let rightHand: THREE.Bone | null = null;
  let spine2: THREE.Bone | null = null;

  return {
    init(ctx: VfxContext) {
      scene = ctx.scene;
      unibeam = makeLaser(scene, 0x00f0ff);
      handLasers = [makeLaser(scene, 0x00f0ff), makeLaser(scene, 0x00f0ff)];

      // Find bones dynamically in the hierarchy
      ctx.modelRoot.traverse((o) => {
        if (!(o as THREE.Bone).isBone) return;
        const name = o.name;
        if (/LeftHand(?!Thumb|Index|Middle|Ring|Pinky)/i.test(name) && !leftHand) leftHand = o as THREE.Bone;
        if (/RightHand(?!Thumb|Index|Middle|Ring|Pinky)/i.test(name) && !rightHand) rightHand = o as THREE.Bone;
        if (/Spine2/i.test(name) && !spine2) spine2 = o as THREE.Bone;
      });
    },

    update(_dt: number, _time: number, fx: FxConfig, _ctx: VfxContext) {
      // Unibeam
      const beamInt = typeof fx.unibeamLaser === "number" ? fx.unibeamLaser : 0;
      unibeam?.setIntensity(beamInt, 1.25);
      if (unibeam && beamInt > 0.05 && spine2) {
        const pos = new THREE.Vector3(0, 0.05, 0.05);
        spine2.localToWorld(pos);
        unibeam.group.position.copy(pos);

        const q = new THREE.Quaternion();
        spine2.getWorldQuaternion(q);
        unibeam.group.quaternion.copy(q);
      }

      // Hand lasers
      const laserInt = typeof fx.handLaser === "number" ? fx.handLaser : 0;
      handLasers.forEach((l) => l.setIntensity(laserInt, 0.85));
      if (laserInt > 0.05) {
        if (leftHand && handLasers[0]) {
          const posL = new THREE.Vector3();
          leftHand.getWorldPosition(posL);
          handLasers[0].group.position.copy(posL);
          const qL = new THREE.Quaternion();
          leftHand.getWorldQuaternion(qL);
          handLasers[0].group.quaternion.copy(qL);
        }
        if (rightHand && handLasers[1]) {
          const posR = new THREE.Vector3();
          rightHand.getWorldPosition(posR);
          handLasers[1].group.position.copy(posR);
          const qR = new THREE.Quaternion();
          rightHand.getWorldQuaternion(qR);
          handLasers[1].group.quaternion.copy(qR);
        }
      }
    },

    dispose() {
      unibeam?.dispose();
      handLasers.forEach((l) => l.dispose());
    },
  };
}
