/**
 * VFX Registry — each theme declares which VFX systems to activate.
 * The orchestrator iterates them generically instead of if/else branching.
 */
import * as THREE from "three";
import type { VfxSystem, VfxContext, ThemeKey } from "../types";
import { createWheelSpin } from "./WheelSpin";
import { createAirflow } from "./Airflow";
import { createCharacterMotion } from "./CharacterMotion";
import { createThrusterFX } from "./ThrusterFX";
import { createLaserBeam } from "./LaserBeam";
import { createVisorHUD } from "./VisorHUD";
import { createThrusterLight } from "./ThrusterLight";
import { createChestRingFX } from "./ChestRingFX";
import { createShoulderLockFX } from "./ShoulderLockFX";
import { createNaniteSweepFX } from "./NaniteSweepFX";
import { createUnderglow } from "./Underglow";
import { createScannerLine } from "./ScannerLine";
import { createSteeringHolo } from "./SteeringHolo";
import { createErsLightning } from "./ErsLightning";

export type { VfxSystem, VfxContext };

/** Theme → VFX factory list. */
const VFX_REGISTRY: Record<ThemeKey, Array<(ctx: VfxContext) => VfxSystem>> = {
  f1: [
    createWheelSpin,
    createAirflow,
    createUnderglow,
    createScannerLine,
    createSteeringHolo,
    createErsLightning,
  ],
  "iron-man": [
    createCharacterMotion,
    createThrusterFX,
    createLaserBeam,
    createVisorHUD,
    createThrusterLight,
    createChestRingFX,
    createShoulderLockFX,
    createNaniteSweepFX,
  ],
};

/** Instantiate all VFX systems for a given theme. */
export function createVfxSuite(ctx: VfxContext): VfxSystem[] {
  const factories = VFX_REGISTRY[ctx.themeKey] || [];
  const systems: VfxSystem[] = [];
  for (const factory of factories) {
    const sys = factory(ctx);
    sys.init(ctx);
    systems.push(sys);
  }
  return systems;
}
