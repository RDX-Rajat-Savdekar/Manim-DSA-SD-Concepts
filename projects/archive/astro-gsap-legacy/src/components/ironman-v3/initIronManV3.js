import { initIronManV2 } from "../ironman-v2/initIronManV2.js";
import { initGarage3DSection } from "../shared/initGarage3D.js";

export function initIronManV3() {
  initIronManV2();
  initGarage3DSection();
}
