# 3D Model Attribution

## Garage F1 — `/models/f1-amr23-parts.glb` (active multi-mesh)

- Source: [GetGLB Formula 1 Car](https://www.getglb.com/vehicles/formula-1-car/) → `mclaren_mp45__formula_1.glb`
- Author: dark_igorek (via Get3DModels / GetGLB)
- License: CC Attribution
- Notes: 16 meshes; front/rear axle-span wheel meshes detected heuristically for spin. HUD branding remains AMR23-style.

## Garage F1 (legacy backup) — `/models/f1-amr23.glb`

- Source: user download `~/Downloads/aston_martin_f1_amr23_2023.glb` (~54 MB, Sketchfab-class AMR23)
- Single mesh after optimize — not used for wheel spin.

## Garage F1 (named hubs) — `/models/f1-w13.glb`

- Source: `f1_mercedes_w13_concept.glb`
- Named front hub/tyre nodes (partial); kept as fallback.

## Garage Iron Man — `/models/iron-man-rigged.glb` (active)

- Source: user download `~/Downloads/iron-man_mark_85__rigged.glb` (Sketchfab Mixamo-rigged Mark 85, CC Attribution)
- Optimized locally to ~10.7 MB (meshopt + webp, no simplify — preserves skin weights)
- 66 Mixamo bones, 10 skinned meshes
- **Animations:** loaded from `/models/mixamo-anims.glb` (Three.js Xbot Mixamo clips), retargeted at runtime onto `mixamorig*_NN` bones — see `public/models/_src/mixamo/README.md`
- Thruster FX bind to foot/hand bones

## Garage Iron Man (legacy) — `/models/iron-man.glb`

- Source: user download `~/Downloads/iron_man_mark_85.glb`
- Named material groups (`Arc_Reactor`, `Mask`, `Eye_*`, `Lights`, …). No skeleton.

## Other

- `/models/iron-man-body.glb` — body sculpture alternate
- `/models/chronograph-watch.glb` — Khronos ChronographWatch (CC-BY 4.0)
- Schematics: see `/public/schematics/README.md`
