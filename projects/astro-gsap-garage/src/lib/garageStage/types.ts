/**
 * Shared type definitions for the Garage3D stage system.
 */
import type * as THREE from "three";

/** Camera look parameters — spherical orbit around the model. */
export interface Look {
  azimuth: number;   // degrees, horizontal orbit angle
  elevation: number; // degrees, vertical angle above horizon
  zoom: number;      // multiplier on base distance (1 = default)
  tx: number;        // target X offset (normalized to model size)
  ty: number;        // target Y offset
  tz: number;        // target Z offset
  fov: number;       // camera field of view in degrees
}

/** Raw annotation data as authored per beat. */
export interface RawAnnotation {
  id: "hero" | "outro" | number;
  label?: string;
  sectionId?: string;
  look: number[];  // [azimuth, elevation, zoom, tx, ty, tz, fov]
  spin: number;
  explode: number;
  title: string | null;
  body: string | null;
}

/** Beat FX configuration — varies per theme. */
export interface FxConfig {
  // F1
  wheels?: number;
  airflow?: number;
  focusStream?: string;
  engineRumble?: boolean | number;
  frontUnderglow?: boolean | number;
  scannerSweep?: boolean | number;
  sidepodHeat?: boolean | number;
  steeringHolo?: boolean | number;
  underglowPulse?: boolean | number;
  drsOpen?: boolean | number;
  engineGlow?: boolean | number;
  ersLightning?: boolean | number;
  tyreSmoke?: boolean | number;
  tyreThermo?: boolean | number;

  // Iron Man
  clip?: string;
  /** Play clip backward (outro sit-down from standing). */
  clipReverse?: boolean;
  fx?: string;
  thrust?: number;
  eyeGlow?: number;
  chestBlast?: boolean | number;
  headScan?: boolean | number;
  unibeamLaser?: boolean | number;
  handLaser?: boolean | number;
  groundSpot?: boolean | number;
  shouldersLock?: boolean | number;
  backJetBlast?: boolean | number;
  naniteSweep?: boolean | number;
  shake?: number;

  [key: string]: unknown;
}

/** Normalized beat — merged from annotation + theme HUD/FX data. */
export interface Beat {
  index: number;
  id: "hero" | "outro" | number;
  label: string | null;
  title: string | null;
  body: string | null;
  kicker: string;
  stats: [string, string][];
  look: Look;
  explode: number;
  spin: number;
  fx: FxConfig;
}

/** Scrub payload emitted on every ScrollTrigger update. */
export interface ScrubPayload {
  look: Look;
  explode: number;
  spin: number;
  fx: FxConfig;
  beatIndex: number;
  progress: number;
}

/** Studio theme settings for a Garage3D instance. */
export interface GarageTheme {
  bg: number;
  key: number;
  fill: number;
  rim: number;
  accent: number;
  exposure: number;
  envIntensity: number;
  envMapIntensity: number;
  hdri: string;
  spin: number;
  warm: number;
  fogDensity: number;
  ambient: number;
  hemi: number;
  keyInt: number;
  fillInt: number;
  rimInt: number;
  frontInt: number;
}

export type ThemeKey = "f1" | "iron-man";

/** VFX system interface — each VFX module implements this. */
export interface VfxSystem {
  /** Called once after model is loaded. */
  init(ctx: VfxContext): void;
  /** Called every frame. */
  update(dt: number, time: number, fx: FxConfig, ctx: VfxContext): void;
  /** Clean up Three.js objects. */
  dispose(): void;
}

/** Context passed to VFX systems — shared references. */
export interface VfxContext {
  scene: THREE.Scene;
  modelRoot: THREE.Object3D;
  pivot: THREE.Group;
  modelSize: THREE.Vector3;
  themeKey: ThemeKey;
  theme: GarageTheme;
  mobileLite: boolean;
  motionOff: boolean;
  /** Active render camera (for billboard HUD FX). */
  camera?: THREE.Camera;
  /** When true, AnimationMixer owns bone poses — skip procedural CharacterMotion. */
  clipDriven?: boolean;
  /** Deterministic bone sockets (updated each frame after mixer). */
  sockets?: import("./RigSockets").RigSockets;
  /** Active Mixamo clip progress 0–1 (for timed FX like unibeam). */
  clipProgress?: number;
  /** Active Mixamo clip canonical name. */
  clipName?: string;
}
