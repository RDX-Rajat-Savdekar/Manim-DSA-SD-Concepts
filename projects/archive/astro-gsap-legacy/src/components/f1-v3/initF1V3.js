import { gsap, Flip, ScrollToPlugin } from "../../lib/gsap.js";
import { initF1V2 } from "../f1-v2/initF1V2.js";
import { initGarage3DSection } from "../shared/initGarage3D.js";

void Flip;
void ScrollToPlugin;

/**
 * V3 = v2 GSAP sections + Flip TOC → pinned Garage3D beats.
 */
export function initF1V3() {
  initF1V2({ skipGarage: true });
  const garageApi = initGarage3DSection();

  const chips = gsap.utils.toArray("[data-f1-chip]");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const state = Flip.getState("[data-f1-chip]");
      chips.forEach((c) => {
        c.classList.remove("is-feature");
        const body = c.querySelector("[data-f1-chip-body]");
        if (body) body.textContent = c.dataset.title || "";
      });
      chip.classList.add("is-feature");
      const body = chip.querySelector("[data-f1-chip-body]");
      if (body) body.textContent = chip.dataset.body || "";
      Flip.from(state, {
        duration: 0.45,
        ease: "power2.inOut",
        absolute: true,
        stagger: 0.03,
      });

      const beat = Number(chip.dataset.beat);
      const garage = document.querySelector("#garage-3d");
      if (garage && Number.isFinite(beat)) {
        gsap.to(window, {
          duration: 0.75,
          scrollTo: { y: garage, offsetY: 80 },
          ease: "power2.inOut",
          onComplete: () => garageApi.scrollToBeat(beat),
        });
      }
    });
  });
}
