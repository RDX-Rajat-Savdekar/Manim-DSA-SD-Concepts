# Agent handoff — astro-gsap

**Contest:** [Webflow × GSAP × CodeTV](https://codetv-gsap-cloud.webflow.io/) · deadline **Jul 31, 2026**  
**Repo:** https://github.com/RDX-Rajat-Savdekar/astro-gsap  
**Read first:** [`journal.md`](journal.md) (latest entries) · [`docs/REBUILD_F1_IRONMAN.md`](docs/REBUILD_F1_IRONMAN.md)

## What ships today (v3 hybrid)

| Route | What it is |
|-------|------------|
| `/` | Hub — points at v3 F1 / Iron Man |
| **`/f1`** | **Primary F1** — GSAP sections + pinned Garage3D |
| **`/iron-man`** | **Primary Iron Man** — GSAP sections + pinned Garage3D |
| `/f1-v2`, `/iron-man-v2` | Parked SVG-only experiments |
| `/archive/f1`, `/archive/iron-man` | ProductStage v1 films |
| `/learn` | GSAP/Astro practice lab (keep) |

## Architecture (do not resurrect ProductStage as primary)

```text
src/lib/garageStage/
  createGarageStage.js   # Three.js island: load GLB, studio HDRI env-only, beats
  beatController.js      # ScrollTrigger pin + scrub look/explode/spin/fx
  modelMotion.js         # F1 wheels + CFD airflow; IM Mixamo bone poses + thrusters
  garageHud.js           # strip, hotspots, schematics, particles, telemetry
  themes.js              # GARAGE_THEMES, BEAT_HUD, BEAT_FX, normalizeBeats
  schematics.js          # beat → /public/schematics/*.svg

src/components/shared/Garage3D.astro + initGarage3D.js
src/components/f1-v3/    # composes f1-v2 sections + Garage3D
src/components/ironman-v3/
src/archive/product-films-v1/   # old monolith — archive only
```

**Lighting rule:** solid dark `scene.background`; HDRI for **reflections only** (`studio_small_09`). Never blow out with warehouse plate.

## Active models (gitignored — restore locally)

| File | Used by | Notes |
|------|---------|-------|
| `f1-amr23-parts.glb` | `/f1` garage | Multi-mesh F1; wheels `Object_10`/`Object_27` |
| `iron-man-rigged.glb` | `/iron-man` garage | Mixamo 66 bones; poses procedural (no clips in file) |
| `f1-amr23.glb` | backup / sequences | Single mesh — no wheel spin |
| `iron-man.glb` | legacy / archive | Named materials, no rig |

Restore steps: [`public/models/README.md`](public/models/README.md) · attribution: [`public/models/ATTRIBUTION.md`](public/models/ATTRIBUTION.md)

```bash
# After copying Downloads → _src / models:
npm run audit:glb -- public/models/iron-man-rigged.glb
npm run dev   # http://127.0.0.1:4321
```

## Design / UX constraints (user)

- Prefer **existing online assets** (Sketchfab/GetGLB/Iconify/Wikimedia) over inventing placeholder graphics.
- Garage HUD: v1 film UI (strip, hotspots, feature card); hide clutter on tight zooms (`is-tight`).
- Active Theory energy: layers, particles, grain — not empty flat stages.
- Don’t invent bone/clip names; audit GLBs first (`scripts/audit-glb.mjs`).

## Likely next work

1. **Iron Man clips in Blender** (preferred): [`blender/iron-man-rig/README.md`](blender/iron-man-rig/README.md) — rename bones, assign Mixamo FBX, export GLB with embedded actions.
2. Web debug lab: `/debug/iron-man-rig` (only until Blender export lands).
3. Contest deploy + single submission URL.
4. Mobile garage perf pass.

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run audit:glb -- path.glb` | Mesh/bone/clip dump |
| `npm run optimize:models` | HQ optimize from `_src/` (see script) |
