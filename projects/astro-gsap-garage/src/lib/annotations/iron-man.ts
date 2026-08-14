/**
 * Iron Man Mark 85 annotation shots — camera positions, labels, and descriptions per beat.
 * look = [azimuth, elevation, zoom, tx, ty, tz, fov]
 * Camera looks tuned via /debug/iron-man-anims.
 */
import type { RawAnnotation } from "../garageStage/types";

export const ironManAnnotations: RawAnnotation[] = [
  {
    id: "hero",
    look: [14, 19.5, 1.06, -0.32, -0.01, -0.01, 26],
    spin: 0.35,
    explode: 0,
    title: null,
    body: null,
  },
  {
    id: 1,
    label: "Arc Reactor",
    sectionId: "reactor",
    look: [-6, -20, 0.3, -0.1, 0.3, -0.06, 26],
    spin: 0.08,
    explode: 0,
    title: "Reactor online",
    body: "Palladium to vibranium — the core wakes and the suit remembers how to live.",
  },
  {
    id: 2,
    label: "Combat HUD",
    look: [-11, -20, 0.78, -0.17, 0.11, 0.1, 26],
    spin: 0.12,
    explode: 0,
    title: "Systems armed",
    body: "Visor locks targets while the suit throws hands — combat starts with the punch.",
  },
  {
    id: 3,
    label: "Unibeam",
    look: [-1, 21, 0.56, -0.26, 0.26, 0.3, 27],
    spin: 0.05,
    explode: 0,
    title: "Chest cannon",
    body: "Hands forward — the same star that keeps him alive empties a city block.",
  },
  {
    id: 4,
    label: "Wall crawl",
    look: [36, 29.5, 0.77, -0.4, -0.05, 0.3, 30],
    spin: 0.18,
    explode: 0,
    title: "Spider mimic",
    body: "Armor plates grip like a web-line — Mark 85 can crawl where no jet should.",
  },
  {
    id: 5,
    label: "Butterfly",
    look: [336, 1.5, 0.88, -0.4, 0.12, 0.05, 29],
    spin: 0.25,
    explode: 0.04,
    title: "Plate flourish",
    body: "A spinning flourish — armor living before the next leap.",
  },
  {
    id: 6,
    label: "Hang time",
    look: [7, 22, 1.02, -0.4, -0.13, -0.06, 31],
    spin: 0.15,
    explode: 0,
    title: "Weightless",
    body: "A float before the burn — the suit hangs, then commits to the sky.",
  },
  {
    id: 7,
    label: "Flight",
    look: [134, 30.5, 0.63, 0.26, 0.18, -0.12, 28],
    spin: 0.1,
    explode: 0,
    title: "Full burn",
    body: "Boots and back jets stream along the body — the sky becomes a runway.",
  },
  {
    id: 8,
    label: "Flip kick",
    look: [-13, 5, 0.79, -0.4, 0.14, 0.06, 27],
    spin: 0.22,
    explode: 0.06,
    title: "Nanite strike",
    body: "Flip, kick, reform — nanites ride the motion like living metal.",
  },
  {
    // Clip plays standing in reverse (sit-down)
    id: "outro",
    look: [360, -20, 0.56, -0.14, 0.18, 0, 32],
    spin: -0.35,
    explode: 0,
    title: null,
    body: null,
  },
];
