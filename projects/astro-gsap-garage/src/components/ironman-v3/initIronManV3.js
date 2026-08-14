import { initIronManV2 } from "../ironman-v2/initIronManV2.js";
import { initGarage3DSection } from "../shared/initGarage3D.js";
import { initBeatPolish } from "../shared/initBeatPolish.js";

export function initIronManV3() {
  initBeatPolish();
  initIronManV2();
  initGarage3DSection();
}
