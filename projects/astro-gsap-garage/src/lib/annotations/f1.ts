/**
 * F1 AMR23 annotation shots — camera positions, labels, and descriptions per beat.
 * look = [azimuth, elevation, zoom, tx, ty, tz, fov]
 * explode stays thin — subtle aero gaps, not a full teardown debris field.
 */
import type { RawAnnotation } from "../garageStage/types";

export const f1Annotations: RawAnnotation[] = [
  {
    id: "hero",
    look: [40, 12, 1.05, 0.22, 0.08, 0, 30],
    spin: 0.4,
    explode: 0,
    title: null,
    body: null,
  },
  {
    id: 1,
    label: "Front wing",
    sectionId: "aero",
    look: [-55, 18, 0.32, 0.48, 0.05, 0.35, 17],
    spin: 0.22,
    explode: 0,
    title: "Air starts here",
    body: "Every vane is a decision about downforce vs drag.",
  },
  {
    id: 2,
    label: "Nose",
    look: [20, 22, 0.3, 0.35, 0.15, 0.25, 17],
    spin: 0.18,
    explode: 0,
    title: "Crash structure",
    body: "First contact with the wall — and with the air.",
  },
  {
    id: 3,
    label: "Sidepods",
    look: [95, 10, 0.28, 0.05, 0.12, -0.05, 17],
    spin: 0.2,
    explode: 0,
    title: "Cooling sculpture",
    body: "Inlets that feed radiators without killing flow.",
  },
  {
    id: 4,
    label: "Halo",
    look: [70, 8, 0.3, 0.0, 0.25, 0.05, 17],
    spin: 0.15,
    explode: 0,
    title: "Cockpit shield",
    body: "Titanium arch. Driver first.",
  },
  {
    id: 5,
    label: "Floor",
    look: [130, 6, 0.32, 0.1, 0.0, 0.1, 17],
    spin: 0.22,
    explode: 0,
    title: "Ground effect",
    body: "The real wing is under the car.",
  },
  {
    id: 6,
    label: "Rear wing",
    look: [175, 14, 0.3, -0.42, 0.22, -0.2, 17],
    spin: 0.2,
    explode: 0,
    title: "DRS plane",
    body: "Drag when you need it. Open when you don't.",
  },
  {
    id: 7,
    label: "Power unit",
    look: [190, 10, 0.34, -0.2, 0.08, -0.35, 17],
    spin: 0.18,
    explode: 0,
    title: "Hybrid heart",
    body: "ICE + ERS in a packaging puzzle.",
  },
  {
    id: 8,
    label: "Tyres",
    look: [220, 5, 0.26, 0.4, -0.18, 0.2, 17],
    spin: 0.35,
    explode: 0.04,
    title: "Contact patch",
    body: "Four handprints of rubber decide the lap.",
  },
  {
    id: "outro",
    look: [260, 12, 1.12, 0.2, 0.08, 0, 30],
    spin: 0.55,
    explode: 0.12,
    title: null,
    body: null,
  },
];
