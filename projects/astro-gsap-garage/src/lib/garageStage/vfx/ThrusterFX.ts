/**
 * ThrusterFX — particles trail along body axis (not world-down) from boot/palm/back sockets.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, FxConfig } from "../types";
import { fxIntensity, type SocketId } from "../RigSockets";

export function createThrusterFX(_ctx: VfxContext): VfxSystem {
  let points: THREE.Points | null = null;
  let geo: THREE.BufferGeometry | null = null;
  let mat: THREE.PointsMaterial | null = null;
  let positions: Float32Array;
  const origins = [new THREE.Vector3(), new THREE.Vector3()];
  const dirs = [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0)];
  let strength = 0;
  let mode = "boots";
  let count = 0;
  const _quat = new THREE.Quaternion();
  const _back = new THREE.Vector3();
  const _axis = new THREE.Vector3();
  const _chest = new THREE.Vector3();
  const _feet = new THREE.Vector3();

  /** Suit long-axis: chest → mid-boots (streams with a flat / flying pose). */
  function bodyAxis(ctx: VfxContext, out: THREE.Vector3): boolean {
    const sockets = ctx.sockets;
    if (!sockets?.has("unibeam") || !sockets.has("bootL") || !sockets.has("bootR")) return false;
    sockets.getWorld("unibeam", _chest);
    sockets.getWorld("bootL", origins[0]);
    sockets.getWorld("bootR", origins[1]);
    _feet.lerpVectors(origins[0], origins[1], 0.5);
    out.subVectors(_feet, _chest);
    if (out.lengthSq() < 1e-6) return false;
    out.normalize();
    return true;
  }

  function fillOrigin(ctx: VfxContext, id: SocketId, outPos: THREE.Vector3) {
    ctx.sockets?.getWorld(id, outPos);
  }

  return {
    init(ctx: VfxContext) {
      count = ctx.mobileLite ? 48 : 96;
      positions = new Float32Array(count * 3);
      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      mat = new THREE.PointsMaterial({
        color: ctx.theme.accent, size: 0.045,
        transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      ctx.scene.add(points);
    },

    update(_dt: number, _time: number, fx: FxConfig, ctx: VfxContext) {
      strength = THREE.MathUtils.clamp(typeof fx.thrust === "number" ? fx.thrust : 0, 0, 1.5);
      mode = typeof fx.fx === "string" ? fx.fx : "boots";
      const clip = ctx.clipName || "";
      const alongBody =
        clip === "thrust" || clip === "falling" || fxIntensity(fx.backJetBlast) > 0.05;

      if (!mat || !geo || !points) return;
      mat.opacity = strength * 0.85;
      points.visible = strength > 0.04 && mode !== "none";
      if (strength < 0.04 || mode === "none") {
        if (mat) mat.opacity = 0;
        return;
      }

      const back = fxIntensity(fx.backJetBlast) > 0.05;
      let spread = 0.08;

      if (mode === "repulsors" || clip === "quadpunch") {
        fillOrigin(ctx, "palmL", origins[0]);
        fillOrigin(ctx, "palmR", origins[1]);
        if (ctx.sockets) {
          ctx.sockets.getWorldQuat("palmL", _quat);
          dirs[0].set(0, 0, -1).applyQuaternion(_quat).normalize();
          ctx.sockets.getWorldQuat("palmR", _quat);
          dirs[1].set(0, 0, -1).applyQuaternion(_quat).normalize();
        }
        spread = 0.12;
      } else if (mode === "unibeam") {
        fillOrigin(ctx, "unibeam", origins[0]);
        origins[1].copy(origins[0]);
        if (ctx.sockets?.has("unibeam")) {
          ctx.sockets.getWorldQuat("unibeam", _quat);
          dirs[0].set(0, 0, -1).applyQuaternion(_quat).normalize();
          dirs[1].copy(dirs[0]);
        }
        spread = 0.1;
      } else {
        fillOrigin(ctx, "bootL", origins[0]);
        fillOrigin(ctx, "bootR", origins[1]);
        if (alongBody && bodyAxis(ctx, _axis)) {
          dirs[0].copy(_axis);
          dirs[1].copy(_axis);
        } else if (ctx.sockets?.has("bootL")) {
          // Standing hover — emit mostly sole-down in foot space
          ctx.sockets.getWorldQuat("bootL", _quat);
          dirs[0].set(0, -1, 0.1).applyQuaternion(_quat).normalize();
          ctx.sockets.getWorldQuat("bootR", _quat);
          dirs[1].set(0, -1, 0.1).applyQuaternion(_quat).normalize();
        }
      }

      const now = performance.now() * 0.001;
      const hasBack = back && ctx.sockets?.has("backJet");
      if (hasBack) {
        ctx.sockets!.getWorld("backJet", _back);
        // Back jet trails opposite travel; use body axis when available
        if (bodyAxis(ctx, _axis)) {
          // already chest→feet; keep streaming aft of the suit
        } else {
          ctx.sockets!.getWorldQuat("backJet", _quat);
          _axis.set(0, 0, 1).applyQuaternion(_quat).normalize();
        }
      }

      for (let i = 0; i < count; i++) {
        const useBack = hasBack && i % 3 === 0;
        const o = useBack ? _back : origins[i % origins.length];
        const d = useBack ? _axis : dirs[i % dirs.length];
        const life = (now * (1.5 + strength) + i * 0.07) % 1;
        const a = i * 2.399;
        const travel = life * (0.45 + strength * 0.7);
        const side = Math.cos(a) * spread * strength * (0.35 + life);
        const side2 = Math.sin(a) * spread * 0.45 * (0.35 + life);
        positions[i * 3] = o.x + d.x * travel + side * (1 - Math.abs(d.x));
        positions[i * 3 + 1] = o.y + d.y * travel + side2 * 0.5;
        positions[i * 3 + 2] = o.z + d.z * travel + side * (1 - Math.abs(d.z)) * 0.5;
      }
      geo.attributes.position.needsUpdate = true;
    },

    dispose() {
      if (points) points.parent?.remove(points);
      geo?.dispose();
      mat?.dispose();
    },
  };
}
