# GSAP, Astro & Webflow Cloud — CodeTV hackathon fork

Astro + **GSAP** (all plugins via `src/lib/gsap.js`) + Three.js product films for the [Webflow × GSAP × CodeTV](https://codetv-gsap-cloud.webflow.io/) hackathon (deadline Jul 31, 2026).

**For agents / continuing work:** [`AGENTS.md`](AGENTS.md) · [`journal.md`](journal.md) · [`docs/REBUILD_F1_IRONMAN.md`](docs/REBUILD_F1_IRONMAN.md)

## Primary routes

| URL | Description |
|-----|-------------|
| `/` | Hub |
| `/f1` | **F1 v3** — GSAP story + pinned Garage3D (wheels + airflow) |
| `/iron-man` | **Iron Man v3** — GSAP story + pinned Mixamo-rigged Garage3D |
| `/learn` | Hands-on GSAP/Astro lab |
| `/archive/f1`, `/archive/iron-man` | ProductStage v1 archive |
| `/f1-v2`, `/iron-man-v2` | Parked SVG-only |

## Quick start

```bash
npm install
# Restore GLBs — see public/models/README.md (gitignored)
npm run dev
```

Open http://127.0.0.1:4321/f1 and `/iron-man`.

## Project structure (current)

```text
src/
  lib/garageStage/     ← v3 Three.js film island + motion + HUD
  lib/annotations/     ← beat camera looks (f1 / iron-man)
  lib/gsap.js          ← all plugins registered once
  components/f1-v3/ ironman-v3/ shared/Garage3D.*
  components/f1-v2/ ironman-v2/   ← GSAP sections reused by v3
  archive/product-films-v1/       ← old ProductStage
  pages/learn/                    ← workshop routes
public/
  models/              ← GLBs gitignored; README restore steps
  schematics/          ← part callout SVGs
  sequences/           ← WebP assembly frames
  hdri/                ← studio env
```

## GSAP plugins

Import from `src/lib/gsap.js` only (already `registerPlugin`’d). See the [GSAP Cheatsheet](https://gsap.com/cheatsheet/).

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Production build → `./dist/` |
| `npm run audit:glb -- <file>` | List meshes / bones / clips |
| `npm run optimize:models` | HQ optimize from `public/models/_src/` |

## Deploy

Template supports [Deploy to Webflow Cloud](https://webflow.com/dashboard/cloud/deploy). Point at this repo after models are present in the Cloud build environment (or CDN them).

## Docs

- [GSAP Documentation](https://gsap.com/docs/)
- [Astro Documentation](https://docs.astro.build)
- [Webflow Cloud](https://developers.webflow.com/webflow-cloud/bring-your-own-app)
