/**
 * ModelLoader — GLB loading, auto-fit, material fixes, and thin explode system.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { GarageTheme } from "./types";

export interface ExplodePart {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  dir: THREE.Vector3;
  dist: number;
}

export interface ModelLoaderApi {
  loadModel(url: string): Promise<THREE.Group>;
  loadAnimations(url: string): Promise<THREE.AnimationClip[]>;
  /** Load clips + source armature (for rest-relative Mixamo retarget). */
  loadAnimPack(url: string): Promise<{ clips: THREE.AnimationClip[]; sourceRoot: THREE.Object3D | null }>;
  fitModel(object: THREE.Object3D, ground: THREE.Mesh): { modelSize: THREE.Vector3; baseDistance: number };
  fixMaterials(root: THREE.Object3D, theme: GarageTheme): void;
  buildExplodeParts(root: THREE.Object3D, modelSize: THREE.Vector3): ExplodePart[];
  applyExplode(parts: ExplodePart[], t: number, smooth: { value: number }): void;
  dispose(): void;
}

export function createModelLoader(): ModelLoaderApi {
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);

  // Ensure MeshoptDecoder is ready
  Promise.resolve(MeshoptDecoder.ready).catch(() => {});

  const _off = new THREE.Vector3();
  const _q = new THREE.Quaternion();

  async function loadModel(url: string): Promise<THREE.Group> {
    const gltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>(
      (resolve, reject) => {
        loader.load(url, resolve as (gltf: unknown) => void, undefined, reject);
      },
    );
    return gltf.scene;
  }

  async function loadAnimations(url: string): Promise<THREE.AnimationClip[]> {
    const pack = await loadAnimPack(url);
    return pack.clips;
  }

  async function loadAnimPack(
    url: string,
  ): Promise<{ clips: THREE.AnimationClip[]; sourceRoot: THREE.Object3D | null }> {
    try {
      const gltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>(
        (resolve, reject) => {
          loader.load(url, resolve as (gltf: unknown) => void, undefined, reject);
        },
      );
      return {
        clips: gltf.animations || [],
        sourceRoot: gltf.scene || null,
      };
    } catch {
      return { clips: [], sourceRoot: null };
    }
  }

  function fitModel(
    object: THREE.Object3D,
    ground: THREE.Mesh,
  ): { modelSize: THREE.Vector3; baseDistance: number } {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    object.scale.setScalar(1.85 / maxDim);
    object.updateMatrixWorld(true);

    const scaled = new THREE.Box3().setFromObject(object);
    object.position.sub(scaled.getCenter(new THREE.Vector3()));
    object.updateMatrixWorld(true);

    const fitted = new THREE.Box3().setFromObject(object);
    const modelSize = fitted.getSize(new THREE.Vector3());
    object.position.y -= fitted.getCenter(new THREE.Vector3()).y;
    object.position.y += 0.02;

    ground.position.y = -modelSize.y * 0.5;
    ground.scale.setScalar(Math.max(modelSize.x, modelSize.z) * 0.55 + 0.6);

    const radius = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.5 || 0.9;
    const fovRad = THREE.MathUtils.degToRad(28);
    const baseDistance = THREE.MathUtils.clamp((radius * 1.4) / Math.tan(fovRad / 2), 2.2, 7.5);

    return { modelSize, baseDistance };
  }

  function fixMaterials(root: THREE.Object3D, theme: GarageTheme): void {
    root.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        const std = mat as THREE.MeshStandardMaterial;
        const name = `${mesh.name} ${std.name || ""}`;
        const isGold = /gold/i.test(name);
        const isLight = /(light|emissive|lens|arc_reactor|reactor)/i.test(name);

        mat.side = THREE.DoubleSide;

        if (isGold) {
          // Gold was reading as flat neon yellow (max metal + env + accidental emissive).
          if ("metalness" in std) std.metalness = Math.min(std.metalness ?? 1, 0.62);
          if ("roughness" in std) std.roughness = Math.max(std.roughness ?? 0.35, 0.38);
          if (std.emissive?.isColor) std.emissive.setHex(0x000000);
          if ("emissiveIntensity" in std) std.emissiveIntensity = 0;
          if ("envMapIntensity" in std) std.envMapIntensity = Math.min(theme.envMapIntensity, 0.35);
        } else {
          if ("metalness" in std && typeof std.metalness === "number" && std.metalness > 0.95) {
            std.metalness = 0.82;
          }
          if ("roughness" in std && typeof std.roughness === "number" && std.roughness < 0.08) {
            std.roughness = 0.18;
          }
          if ("envMapIntensity" in std && typeof std.envMapIntensity === "number") {
            std.envMapIntensity = theme.envMapIntensity;
          }
          // Keep non-light panels from inheriting a baked emissiveIntensity=1
          if (!isLight && "emissiveIntensity" in std && (std.emissiveIntensity ?? 0) >= 0.99) {
            if (!std.emissive || std.emissive.getHex() === 0) std.emissiveIntensity = 0;
          }
        }

        mat.needsUpdate = true;
      });
    });
  }

  function buildExplodeParts(root: THREE.Object3D, modelSize: THREE.Vector3): ExplodePart[] {
    const meshes: THREE.Mesh[] = [];
    root.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
    });

    const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    const world = new THREE.Vector3();
    const scale = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.12;

    return meshes.map((mesh, i) => {
      const base = mesh.position.clone();
      mesh.getWorldPosition(world);
      const dir = world.clone().sub(center);
      if (dir.lengthSq() < 1e-6) {
        const a = (i / Math.max(1, meshes.length)) * Math.PI * 2;
        dir.set(Math.cos(a), Math.sin(a * 0.7), Math.sin(a));
      }
      dir.normalize();
      return { mesh, base, dir, dist: scale * (0.55 + (i % 5) * 0.06) };
    });
  }

  function applyExplode(parts: ExplodePart[], t: number, smooth: { value: number }): void {
    smooth.value += (t - smooth.value) * 0.12;
    const sv = smooth.value;
    parts.forEach((p) => {
      _off.copy(p.dir).multiplyScalar(sv * p.dist);
      if (p.mesh.parent) {
        p.mesh.parent.getWorldQuaternion(_q).invert();
        _off.applyQuaternion(_q);
      }
      p.mesh.position.copy(p.base).add(_off);
    });
  }

  function dispose() {
    draco.dispose();
  }

  return { loadModel, loadAnimations, loadAnimPack, fitModel, fixMaterials, buildExplodeParts, applyExplode, dispose };
}
