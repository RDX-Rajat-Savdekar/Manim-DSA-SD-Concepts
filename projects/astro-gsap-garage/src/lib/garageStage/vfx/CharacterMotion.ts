/**
 * CharacterMotion VFX — Mixamo bone procedural poses, emissive pulse, world positions.
 * Fixes the old `base` variable bug by capturing root transform at init.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";

const HEAD_NAME = /(mask|helmet|head|eye)/i;
const CHEST_NAME = /(arc_reactor|reactor|chest|unibeam)/i;
const LIGHT_NAME = /(light|emissive|lens|glass)/i;

type BoneKey = "hips" | "spine" | "spine1" | "spine2" | "neck" | "head" |
  "leftArm" | "rightArm" | "leftForeArm" | "rightForeArm" |
  "leftHand" | "rightHand" | "leftUpLeg" | "rightUpLeg" | "leftFoot" | "rightFoot";

export interface CharacterApi {
  bones: Record<BoneKey, THREE.Bone | null>;
  hasRig: boolean;
  play(name: string): void;
  pulseEmissive(amount: number): void;
  getFootWorldPositions(outL?: THREE.Vector3, outR?: THREE.Vector3): { left: THREE.Vector3; right: THREE.Vector3 };
  getHandWorldPositions(outL?: THREE.Vector3, outR?: THREE.Vector3): { left: THREE.Vector3; right: THREE.Vector3 };
}

export function createCharacterMotion(_ctx: VfxContext): VfxSystem & CharacterApi {
  const partMeshes = { head: [] as THREE.Mesh[], chest: [] as THREE.Mesh[], lights: [] as THREE.Mesh[], all: [] as THREE.Mesh[] };
  const bones: Record<BoneKey, THREE.Bone | null> = {
    hips: null, spine: null, spine1: null, spine2: null, neck: null, head: null,
    leftArm: null, rightArm: null, leftForeArm: null, rightForeArm: null,
    leftHand: null, rightHand: null, leftUpLeg: null, rightUpLeg: null, leftFoot: null, rightFoot: null,
  };
  const boneBases = new Map<THREE.Bone, THREE.Quaternion>();
  const skinnedMeshes: THREE.SkinnedMesh[] = [];
  let hasRig = false;
  let activePose = "idle";
  let motionOff = false;
  let root: THREE.Object3D | null = null;

  // FIX: capture base transform at init (was undefined in old codebase)
  const base = { y: 0, rx: 0, ry: 0 };

  const poseBlends: Record<string, number> = { repulse: 0, thrust: 0, look: 0, unibeam: 0 };
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();

  function resetBones() {
    boneBases.forEach((q, bone) => { bone.quaternion.copy(q); });
  }

  function addBoneEuler(bone: THREE.Bone | null, x: number, y: number, z: number, weight = 1) {
    if (!bone || weight <= 0) return;
    const baseQ = boneBases.get(bone);
    if (!baseQ) return;
    _e.set(x * weight, y * weight, z * weight, "XYZ");
    _q.setFromEuler(_e);
    bone.quaternion.copy(baseQ).multiply(_q);
  }

  function applyProceduralPose(poseMode: string, w: number) {
    if (w <= 0.01) return;
    if (poseMode === "repulse") {
      // Body tilts back slightly for a powerful stance
      addBoneEuler(bones.spine2, -0.15 * w, -0.05 * w, 0.05 * w);
      // Right arm raised forward pointing towards front (yaw forward by ~90 degrees, pitch raised slightly)
      addBoneEuler(bones.rightArm, -0.22 * w, -1.35 * w, 0.12 * w);
      // Right elbow kept mostly straight
      addBoneEuler(bones.rightForeArm, 0, 0.05 * w, 0);
      // Right hand bent backward sharply (wrist extension to point palm forward)
      addBoneEuler(bones.rightHand, 0.95 * w, 0, 0.35 * w);
      
      // Left arm back for balance
      addBoneEuler(bones.leftArm, 0.25 * w, 0, -0.45 * w);
      addBoneEuler(bones.leftForeArm, 0.2 * w, 0, -0.2 * w);
      addBoneEuler(bones.neck, 0.05 * w, 0.12 * w, 0);
    } else if (poseMode === "thrust" || poseMode === "flying") {
      addBoneEuler(bones.spine, 0.1 * w, 0, 0);
      addBoneEuler(bones.neck, -0.2 * w, 0, 0);
      addBoneEuler(bones.head, -0.15 * w, 0, 0);
      addBoneEuler(bones.leftArm, -0.15 * w, 0, -0.2 * w);
      addBoneEuler(bones.rightArm, -0.15 * w, 0, 0.2 * w);
      addBoneEuler(bones.leftUpLeg, -0.12 * w, 0, 0);
      addBoneEuler(bones.rightUpLeg, -0.12 * w, 0, 0);
      addBoneEuler(bones.leftFoot, 0.2 * w, 0, 0);
      addBoneEuler(bones.rightFoot, 0.2 * w, 0, 0);
    } else if (poseMode === "look") {
      const angle = Math.sin(performance.now() * 0.003) * 0.35 * w;
      addBoneEuler(bones.neck, 0, angle, 0);
      addBoneEuler(bones.head, 0.08 * w, angle * 0.5, 0);
    } else if (poseMode === "unibeam") {
      addBoneEuler(bones.spine2, -0.15 * w, 0, 0);
      addBoneEuler(bones.neck, 0.05 * w, 0, 0);
      addBoneEuler(bones.leftArm, 0.08 * w, 0, -0.12 * w);
      addBoneEuler(bones.rightArm, 0.08 * w, 0, 0.12 * w);
    }
  }

  function play(name: string) {
    if (motionOff) return;
    activePose = String(name || "idle").toLowerCase();
  }

  function pulseEmissive(amount = 1) {
    // Only glow true light meshes — never gold/red armor panels.
    const targets = partMeshes.lights.length
      ? partMeshes.lights
      : partMeshes.chest.filter((m) => /light|arc_reactor|reactor/i.test(m.name));
    if (!targets.length) return;

    targets.forEach((mesh) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        const stdMat = mat as THREE.MeshStandardMaterial;
        if (/gold/i.test(`${mesh.name} ${stdMat.name || ""}`)) return;
        if ("emissiveIntensity" in stdMat) {
          stdMat.emissiveIntensity = THREE.MathUtils.lerp(stdMat.emissiveIntensity ?? 0.2, 0.35 + amount * 1.4, 0.25);
        }
        if (stdMat.emissive?.isColor) {
          stdMat.emissive.lerp(new THREE.Color(0xffaa33), 0.15 * amount);
        }
      });
    });
  }

  function getFootWorldPositions(outL = new THREE.Vector3(), outR = new THREE.Vector3()) {
    if (bones.leftFoot) bones.leftFoot.getWorldPosition(outL);
    if (bones.rightFoot) bones.rightFoot.getWorldPosition(outR);
    return { left: outL, right: outR };
  }

  function getHandWorldPositions(outL = new THREE.Vector3(), outR = new THREE.Vector3()) {
    if (bones.leftHand) bones.leftHand.getWorldPosition(outL);
    if (bones.rightHand) bones.rightHand.getWorldPosition(outR);
    return { left: outL, right: outR };
  }

  return {
    bones,
    hasRig,
    play,
    pulseEmissive,
    getFootWorldPositions,
    getHandWorldPositions,

    init(ctx: VfxContext) {
      root = ctx.modelRoot;
      motionOff = ctx.motionOff;

      // Capture base transform (the bug fix)
      base.y = root.position.y;
      base.rx = root.rotation.x;
      base.ry = root.rotation.y;

      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh;
          partMeshes.all.push(mesh);
          if (HEAD_NAME.test(mesh.name)) partMeshes.head.push(mesh);
          if (CHEST_NAME.test(mesh.name)) partMeshes.chest.push(mesh);
          if (LIGHT_NAME.test(mesh.name)) partMeshes.lights.push(mesh);
        }
        if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinnedMeshes.push(o as THREE.SkinnedMesh);
        if (!(o as THREE.Bone).isBone) return;
        const n = o.name;
        if (/Hips/i.test(n) && !bones.hips) bones.hips = o as THREE.Bone;
        else if (/Spine2/i.test(n) && !bones.spine2) bones.spine2 = o as THREE.Bone;
        else if (/Spine1/i.test(n) && !bones.spine1) bones.spine1 = o as THREE.Bone;
        else if (/Spine(?!\d)/i.test(n) && !bones.spine) bones.spine = o as THREE.Bone;
        else if (/Neck/i.test(n) && !bones.neck) bones.neck = o as THREE.Bone;
        else if (/Head(?!Top)/i.test(n) && !bones.head) bones.head = o as THREE.Bone;
        else if (/LeftForeArm/i.test(n) && !bones.leftForeArm) bones.leftForeArm = o as THREE.Bone;
        else if (/RightForeArm/i.test(n) && !bones.rightForeArm) bones.rightForeArm = o as THREE.Bone;
        else if (/LeftArm/i.test(n) && !bones.leftArm) bones.leftArm = o as THREE.Bone;
        else if (/RightArm/i.test(n) && !bones.rightArm) bones.rightArm = o as THREE.Bone;
        else if (/LeftHand(?!Thumb|Index|Middle|Ring|Pinky)/i.test(n) && !bones.leftHand) bones.leftHand = o as THREE.Bone;
        else if (/RightHand(?!Thumb|Index|Middle|Ring|Pinky)/i.test(n) && !bones.rightHand) bones.rightHand = o as THREE.Bone;
        else if (/LeftUpLeg/i.test(n) && !bones.leftUpLeg) bones.leftUpLeg = o as THREE.Bone;
        else if (/RightUpLeg/i.test(n) && !bones.rightUpLeg) bones.rightUpLeg = o as THREE.Bone;
        else if (/LeftFoot/i.test(n) && !bones.leftFoot) bones.leftFoot = o as THREE.Bone;
        else if (/RightFoot/i.test(n) && !bones.rightFoot) bones.rightFoot = o as THREE.Bone;
      });

      hasRig = Boolean(bones.hips || bones.spine2 || bones.head);
      Object.values(bones).forEach((b) => { if (b) boneBases.set(b, b.quaternion.clone()); });
      if (!motionOff) play("idle");
    },

    update(dt: number, _time: number, fx: FxConfig, ctx?: VfxContext) {
      if (motionOff || !root) return;

      // Apply clip from FX
      if (fx.clip && typeof fx.clip === "string") {
        const key = String(fx.clip).toLowerCase();
        if (key !== activePose) { activePose = key; }
      }

      // When AnimationMixer owns the rig, only keep emissive / material FX.
      if (ctx?.clipDriven) {
        if (typeof fx.eyeGlow === "number" && fx.eyeGlow > 0) pulseEmissive(fx.eyeGlow);
        if (fx.chestBlast) pulseEmissive(Number(fx.chestBlast) * 1.8);
        return;
      }

      // Blend poses
      for (const k of Object.keys(poseBlends)) {
        const target = (activePose === k || (k === "thrust" && activePose === "flying")) ? 1 : 0;
        poseBlends[k] += (target - poseBlends[k]) * Math.min(1, dt * 5.0);
      }

      if (hasRig) {
        resetBones();
        applyProceduralPose("repulse", poseBlends.repulse);
        applyProceduralPose("thrust", poseBlends.thrust);
        applyProceduralPose("look", poseBlends.look);
        applyProceduralPose("unibeam", poseBlends.unibeam);
        root.position.y = base.y;
        root.rotation.x = base.rx;
        root.rotation.y = base.ry;
        skinnedMeshes.forEach((m) => m.skeleton?.update());
      } else {
        const blend = poseBlends.repulse;
        root.position.y = base.y;
        root.rotation.x = base.rx + blend * -0.04;
        root.rotation.y = base.ry + blend * 0.12;
      }

      // Emissive effects
      if (typeof fx.eyeGlow === "number" && fx.eyeGlow > 0) pulseEmissive(fx.eyeGlow);
      if (fx.chestBlast) pulseEmissive(Number(fx.chestBlast) * 1.8);
    },

    dispose() {
      if (root) {
        resetBones();
        root.position.y = base.y;
        root.rotation.x = base.rx;
        root.rotation.y = base.ry;
      }
    },
  };
}
