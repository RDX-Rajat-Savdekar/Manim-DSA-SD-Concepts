/**
 * CameraRig — spherical orbit camera with smooth lerp, idle drift, and 3D→2D projection.
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
  /** Current target look (pre-drift). */
  getLook(): Look;
  /** Update lerp — call once per frame. */
  update(modelSize: THREE.Vector3, baseDistance: number): void;
  /** Force-snap to current look (no lerp). */
  snap(modelSize: THREE.Vector3, baseDistance: number): void;
  /** Apply camera shake. */
  applyShake(amount: number, time: number): void;
  /** Subtle continuous orbit / breath on top of the scrubbed look. */
  applyDrift(time: number, amount?: number): void;
  /** Project a normalized model-space point to screen coords. */
  getProjection(localNorm: THREE.Vector3, modelSize: THREE.Vector3): { x: number; y: number } | null;
}

export function createCameraRig({ camera, canvas, pivot, motionOff, mobileLite }: CameraRigOptions): CameraRigApi {
  const look: Look = { azimuth: 40, elevation: 12, zoom: 1, tx: 0.2, ty: 0.08, tz: 0, fov: 28 };
  const smooth: Look = { ...look };
  const lerpSpeed = motionOff ? 1 : mobileLite ? 0.16 : 0.11;
  const drift = { az: 0, el: 0, zoom: 0, tx: 0, ty: 0 };

  const focus = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const _world = new THREE.Vector3();
  const _proj = new THREE.Vector3();

  function setLook(target: Look) {
    Object.assign(look, target);
  }

  function getLook(): Look {
    return { ...look };
  }

  function applyCamera(modelSize: THREE.Vector3, baseDistance: number, immediate: boolean) {
    const src = immediate || motionOff ? look : smooth;
    if (!immediate && !motionOff) {
      for (const k of Object.keys(look) as (keyof Look)[]) {
        (smooth as Record<string, number>)[k] += ((look as Record<string, number>)[k] - (smooth as Record<string, number>)[k]) * lerpSpeed;
      }
    }

    const azDeg = src.azimuth + drift.az;
    const elDeg = src.elevation + drift.el;
    const zoom = Math.max(0.2, src.zoom + drift.zoom);

    focus.set(
      (src.tx + drift.tx) * modelSize.x,
      (src.ty + drift.ty) * modelSize.y,
      src.tz * modelSize.z,
    );
    camera.fov = src.fov;
    camera.updateProjectionMatrix();

    const dist = baseDistance * zoom;
    const az = THREE.MathUtils.degToRad(azDeg);
    const el = THREE.MathUtils.degToRad(elDeg);
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
    drift.az = drift.el = drift.zoom = drift.tx = drift.ty = 0;
    applyCamera(modelSize, baseDistance, true);
  }

  function applyShake(amount: number, time: number) {
    if (amount <= 0.05) return;
    const shake = amount * 0.005 * Math.sin(time * 65.0);
    camera.position.x += shake;
    camera.position.y += shake;
  }

  function applyDrift(time: number, amount = 1) {
    if (motionOff || amount <= 0) {
      drift.az = drift.el = drift.zoom = drift.tx = drift.ty = 0;
      return;
    }
    const a = amount;
    // Slow orbit + breath — readable motion without fighting the scroll path
    drift.az = Math.sin(time * 0.2) * 2.4 * a;
    drift.el = Math.cos(time * 0.17) * 1.15 * a;
    drift.zoom = Math.sin(time * 0.14) * 0.028 * a;
    drift.tx = Math.sin(time * 0.11) * 0.014 * a;
    drift.ty = Math.cos(time * 0.13) * 0.01 * a;
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

  return { setLook, getLook, update, snap, applyShake, applyDrift, getProjection };
}
