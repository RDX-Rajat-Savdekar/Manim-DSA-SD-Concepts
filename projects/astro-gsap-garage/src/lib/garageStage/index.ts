/** Barrel re-exports for garageStage module. */
export { createGarageStage, DEBUG_FRONT_LOOK } from "./createGarageStage";
export { createPinnedBeatController, lerp, lerpLook, lerpFx } from "./BeatController";
export { createGarageHud } from "./GarageHud";
export { schematicForBeat, schematicLabel } from "./schematics";
export { GARAGE_THEMES, normalizeBeats, lookFromArray, BEAT_FX, BEAT_HUD } from "./themes";
export { boneKey, aliasClipName, retargetClipsToRoot, collectBoneMap, collectBindQuats, shouldDropClip } from "./retargetMixamo";
export { createRigSockets, fxIntensity } from "./RigSockets";
export type { Look, Beat, FxConfig, GarageTheme, ThemeKey, ScrubPayload, VfxSystem, VfxContext } from "./types";
export type { RigSockets, SocketId } from "./RigSockets";
