/** Barrel re-exports for garageStage module. */
export { createGarageStage } from "./createGarageStage";
export { createPinnedBeatController, lerp, lerpLook, lerpFx } from "./BeatController";
export { createGarageHud } from "./GarageHud";
export { schematicForBeat, schematicLabel } from "./schematics";
export { GARAGE_THEMES, normalizeBeats, lookFromArray, BEAT_FX, BEAT_HUD } from "./themes";
export { boneKey, aliasClipName, retargetClipsToRoot, collectBoneMap, collectBindQuats } from "./retargetMixamo";
export type { Look, Beat, FxConfig, GarageTheme, ThemeKey, ScrubPayload, VfxSystem, VfxContext } from "./types";
