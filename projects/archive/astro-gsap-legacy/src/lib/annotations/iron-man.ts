/**
 * Iron Man Mark 85 annotation shots — camera positions, labels, and descriptions per beat.
 * look = [azimuth, elevation, zoom, tx, ty, tz, fov]
 * explode stays thin — subtle plate gaps, not a full teardown.
 */
import type { RawAnnotation } from "../garageStage/types";

export const ironManAnnotations: RawAnnotation[] = [
  {
    id: "hero",
    look: [32, 6, 1.05, 0.2, 0.05, 0, 30],
    spin: 0.35,
    explode: 0,
    title: null,
    body: null,
  },
  {
    id: 1,
    label: "Arc Reactor",
    sectionId: "reactor",
    look: [-18, 10, 0.3, 0.02, 0.2, 0.22, 16],
    spin: 0,
    explode: 0,
    title: "A star in the chest",
    body: "Palladium to vibranium — the reactor is the heartbeat.",
  },
  {
    id: 2,
    label: "Helmet HUD",
    look: [48, 16, 0.26, 0.05, 0.4, 0.12, 16],
    spin: 0,
    explode: 0,
    title: "Eyes that think",
    body: "Macro on the faceplate. Targeting brackets and threat vectors.",
  },
  {
    id: 3,
    label: "Unibeam",
    look: [15, 8, 0.28, 0.0, 0.22, 0.25, 16],
    spin: 0,
    explode: 0,
    title: "Chest cannon, restrained",
    body: "The same core that keeps him alive can empty a city block.",
  },
  {
    id: 4,
    label: "Repulsors",
    look: [110, 4, 0.28, 0.38, -0.02, 0.15, 16],
    spin: 0,
    explode: 0,
    title: "Palm thrusters",
    body: "Flight control and directed energy in one gesture.",
  },
  {
    id: 5,
    label: "Boot thrusters",
    look: [200, 8, 0.3, 0.1, -0.34, 0.1, 16],
    spin: 0,
    explode: 0,
    title: "Vertical lift",
    body: "Primary thrust for hover and hard acceleration.",
  },
  {
    id: 6,
    label: "Shoulder pods",
    look: [-70, 12, 0.32, 0.15, 0.15, -0.25, 16],
    spin: 0,
    explode: 0,
    title: "Missile pods",
    body: "Shoulder micro-munitions for area denial.",
  },
  {
    id: 7,
    label: "Back thruster",
    look: [155, 5, 0.35, 0.0, 0.05, -0.3, 16],
    spin: 0,
    explode: 0,
    title: "Rear boost",
    body: "Straight-line speed when the sky is the runway.",
  },
  {
    id: 8,
    label: "Nanotech",
    look: [80, 14, 0.4, 0.05, 0.12, 0.05, 16],
    spin: 0,
    explode: 0.08,
    title: "Living armor",
    body: "Plates that flow, seal, and reform on command.",
  },
  {
    id: "outro",
    look: [250, 8, 1.15, 0.18, 0.02, 0, 30],
    spin: 0.5,
    explode: 0.05,
    title: null,
    body: null,
  },
];
