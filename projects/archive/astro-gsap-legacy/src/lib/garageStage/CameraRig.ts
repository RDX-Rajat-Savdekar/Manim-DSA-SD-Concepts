/**
 * CameraRig — spherical orbit camera with smooth lerp and 3D→2D projection.
 */
import * as THREE from "three";
import type { Look } from "./types";

export interface CameraRigOptions {
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  pivot: THREE.Group;
  motionOff: boolean;
  mobileLite: boolean;
}

export interface CameraRigApi {
  /** Set the target look (will lerp toward it). */
  setLook(look: Look): void;
  /** Update lerp — call once per frame. Returns smoothed Look. */
  update(modelSize: THREE.Vector3, baseDistance: number): void;
  /** Force-snap to current look (no lerp). */
  snap(modelSize: THREE.Vector3, baseDistance: number): void;
  /** Apply camera shake. */
  applyShake(amount: number, time: number): void;
  /** Project a normalized model-space point to screen coords. */
  getProjection(localNorm: THREE.Vector3, modelSize: THREE.Vector3): { x: number; y: number } | null;
}

export function createCameraRig({ camera, canvas, pivot, motionOff, mobileLite }: CameraRigOptions): CameraRigApi {
  const look: Look = { azimuth: 40, elevation: 12, zoom: 1, tx: 0.2, ty: 0.08, tz: 0, fov: 28 };
  const smooth: Look = { ...look };
  const lerpSpeed = motionOff ? 1 : mobileLite ? 0.14 : 0.09;

  const focus = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const _world = new THREE.Vector3();
  const _proj = new THREE.Vector3();

  function setLook(target: Look) {
    Object.assign(look, target);
  }

  function applyCamera(modelSize: THREE.Vector3, baseDistance: number, immediate: boolean) {
    const src = immediate || motionOff ? look : smooth;
    if (!immediate && !motionOff) {
      for (const k of Object.keys(look) as (keyof Look)[]) {
        (smooth as Record<string, number>)[k] += ((look as Record<string, number>)[k] - (smooth as Record<string, number>)[k]) * lerpSpeed;
      }
    }

    focus.set(src.tx * modelSize.x, src.ty * modelSize.y, src.tz * modelSize.z);
    camera.fov = src.fov;
    camera.updateProjectionMatrix();

    const dist = baseDistance * src.zoom;
    const az = THREE.MathUtils.degToRad(src.azimuth);
    const el = THREE.MathUtils.degToRad(src.elevation);
    camPos.set(
      focus.x + Math.cos(el) * Math.sin(az) * dist,
      focus.y + Math.sin(el) * dist,
      focus.z + Math.cos(el) * Math.cos(az) * dist,
    );
    camera.position.copy(camPos);
    camera.lookAt(focus);
  }

  function update(modelSize: THREE.Vector3, baseDistance: number) {
    applyCamera(modelSize, baseDistance, false);
  }

  function snap(modelSize: THREE.Vector3, baseDistance: number) {
    Object.assign(smooth, look);
    applyCamera(modelSize, baseDistance, true);
  }

  function applyShake(amount: number, time: number) {
    if (amount <= 0.05) return;
    const shake = amount * 0.005 * Math.sin(time * 65.0);
    camera.position.x += shake;
    camera.position.y += shake;
  }

  function getProjection(
    localNorm: THREE.Vector3,
    modelSize: THREE.Vector3,
  ): { x: number; y: number } | null {
    const wrap = canvas.parentElement;
    const w = wrap?.clientWidth || 1;
    const h = wrap?.clientHeight || 1;
    _world.set(localNorm.x * modelSize.x, localNorm.y * modelSize.y, localNorm.z * modelSize.z);
    pivot.localToWorld(_world);
    _proj.copy(_world).project(camera);
    if (_proj.z > 1) return null;
    return {
      x: (_proj.x * 0.5 + 0.5) * w,
      y: (-_proj.y * 0.5 + 0.5) * h,
    };
  }

  return { setLook, update, snap, applyShake, getProjection };
}
