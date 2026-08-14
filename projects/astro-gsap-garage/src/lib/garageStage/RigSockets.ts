/**
 * Deterministic Mixamo bone sockets for Iron Man VFX.
 * Resolve once by boneKey, then sample world pose each frame after the mixer.
 */
import * as THREE from "three";
import { boneKey, collectBoneMap } from "./retargetMixamo";

export type SocketId =
  | "visor"
  | "unibeam"
  | "palmL"
  | "palmR"
  | "bootL"
  | "bootR"
  | "shoulderL"
  | "shoulderR"
  | "backJet";

const OFFSETS: Record<SocketId, { bone: string; local: THREE.Vector3 }> = {
  // Eyes / faceplate — VisorHUD billboards, so position-only; keep slightly in front of skull
  visor: { bone: "head", local: new THREE.Vector3(0, 0.04, -0.11) },
  // Arc reactor triangle (upper chest), not solar plexus
  unibeam: { bone: "spine2", local: new THREE.Vector3(0, 0.12, 0.16) },
  palmL: { bone: "lefthand", local: new THREE.Vector3(0, -0.03, 0.06) },
  palmR: { bone: "righthand", local: new THREE.Vector3(0, -0.03, 0.06) },
  bootL: { bone: "leftfoot", local: new THREE.Vector3(0, -0.05, 0.02) },
  bootR: { bone: "rightfoot", local: new THREE.Vector3(0, -0.05, 0.02) },
  shoulderL: { bone: "leftshoulder", local: new THREE.Vector3(-0.05, 0, 0.04) },
  shoulderR: { bone: "rightshoulder", local: new THREE.Vector3(0.05, 0, 0.04) },
  backJet: { bone: "spine1", local: new THREE.Vector3(0, 0.08, -0.14) },
};

export interface RigSockets {
  update(): void;
  getWorld(id: SocketId, out?: THREE.Vector3): THREE.Vector3;
  getWorldQuat(id: SocketId, out?: THREE.Quaternion): THREE.Quaternion;
  has(id: SocketId): boolean;
}

export function createRigSockets(modelRoot: THREE.Object3D): RigSockets {
  const boneMap = collectBoneMap(modelRoot);
  const bones = new Map<string, THREE.Object3D>();

  modelRoot.traverse((o) => {
    const key = boneKey(o.name);
    if (!key) return;
    if ((o as THREE.Bone).isBone || /^mixamorig/i.test(o.name)) {
      if (!bones.has(key)) bones.set(key, o);
    }
  });

  // Prefer collectBoneMap names when present
  boneMap.forEach((actual, key) => {
    const found = modelRoot.getObjectByName(actual);
    if (found) bones.set(key, found);
  });

  const _local = new THREE.Vector3();
  const _world = new THREE.Vector3();
  const _quat = new THREE.Quaternion();

  function boneFor(id: SocketId): THREE.Object3D | null {
    const key = OFFSETS[id].bone;
    return bones.get(key) || null;
  }

  return {
    update() {
      modelRoot.updateMatrixWorld(true);
    },
    has(id: SocketId) {
      return Boolean(boneFor(id));
    },
    getWorld(id: SocketId, out = new THREE.Vector3()) {
      const bone = boneFor(id);
      if (!bone) return out.set(0, 0, 0);
      _local.copy(OFFSETS[id].local);
      bone.localToWorld(_local);
      return out.copy(_local);
    },
    getWorldQuat(id: SocketId, out = new THREE.Quaternion()) {
      const bone = boneFor(id);
      if (!bone) return out.identity();
      bone.getWorldQuaternion(_quat);
      return out.copy(_quat);
    },
  };
}

/** Coerce FX flags: true → 1, number → n, else 0. */
export function fxIntensity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === true) return 1;
  return 0;
}
