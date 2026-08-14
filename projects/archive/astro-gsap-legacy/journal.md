# Hackathon Journal — Astro × GSAP × Webflow Cloud

Challenge: [CodeTV × Webflow × GSAP](https://codetv-gsap-cloud.webflow.io/) — build a landing page that *really lands*. Deadline **Jul 31**.

Stack: Astro + GSAP (all plugins free via Webflow) + real GLB models + deploy to Webflow Cloud.

**New agents:** start at [`AGENTS.md`](AGENTS.md), then this file’s **latest entries**, then [`docs/REBUILD_F1_IRONMAN.md`](docs/REBUILD_F1_IRONMAN.md).

---

## 2026-07-12 (evening) — V3 hybrid + motion C+C + handoff

### Status
**Primary product is v3 hybrid** on `/f1` and `/iron-man`. ProductStage v1 archived; SVG-only v2 parked.

### Shipped architecture
- Slim **Garage3D** island (`src/lib/garageStage/*`) — not the ProductStage monolith.
- GSAP hook sections (f1-v2 / ironman-v2) + Flip TOC → `scrollToBeat` + pinned 3D film.
- Film HUD: part strip, projected hotspots, feature card, schematics (sourced SVGs), grain/scan/particles.
- Lighting: studio HDRI **env only**, solid dark bg, dimmer exposures.

### Motion (path C+C)
| Theme | Model | Behavior |
|-------|--------|----------|
| F1 | `f1-amr23-parts.glb` (GetGLB multi-mesh, CC-BY) | Wheel spin (`Object_10`/`Object_27`) + procedural CFD airflow particles/ribbons via `BEAT_FX` |
| Iron Man | `iron-man-rigged.glb` from `~/Downloads/iron-man_mark_85__rigged.glb` | Mixamo 66 bones; procedural idle/look/thrust; thrusters on feet / repulsors on hands |

Key files: `modelMotion.js`, `BEAT_FX` in `themes.js`, `scripts/audit-glb.mjs`.

### Also
- Iron Man assembly teaser scrubbed from `/sequences/iron-man` WebP (not placeholder shapes).
- Schematics in `public/schematics/` (Iconify MDI + Wikimedia) — see that README.
- Checkpoint commit `f9a0592` pushed (v3 HUD/schematics); later motion + rigged IM may still be local — **GLBs remain gitignored**.

### How to continue
```bash
npm run dev
# Restore models if missing — public/models/README.md
open http://127.0.0.1:4321/f1
open http://127.0.0.1:4321/iron-man
```

### Open / next
1. Mixamo animation clips into the rigged GLB (optional — poses work without clips).
2. Contest deploy + single submission URL.
3. Mobile garage perf pass.

---

## 2026-07-12 — V3 garage HUD polish (pre-motion)

### Ask
- V3 lights too bright; restore v1 scrolling-model HUD; more Active Theory layers.

### Done
- Dimmer themes; vignette/grain/scan; DOM particle swarm; DrawSVG→schematic swap; strip + hotspots + FOCUS bar.
- Tight beats (2/3/6) tuck UI so model stays readable.
- Duplicate note card removed.

---

## 2026-07-12 — Archive v1, park v2, ship v3 hybrid

### Why
- ProductStage (~950 lines) became unfixable (lighting wars, coupling).
- Pure SVG v2 felt empty without 3D scrollytelling.
- Hybrid: GSAP sells the open; Garage3D brings the machine back.

### Routes
| Route | Role |
|-------|------|
| `/f1`, `/iron-man` | **v3 primary** |
| `/f1-v2`, `/iron-man-v2` | Parked |
| `/archive/f1`, `/archive/iron-man` | ProductStage v1 |
| `/learn` | Unchanged lab |

Docs: `docs/REBUILD_F1_IRONMAN.md` Parts F–G.

---

## 2026-07-12 — V1 base for three concepts

### Goal
Ship a runnable base for ideas **1 Iron Man**, **2 F1 teardown**, **3 mechanical watch** — Apple-style scroll product pages using **real online 3D models** (no custom meshes).

### Done
- Installed `three` for GLB viewing; kept central GSAP entry in `src/lib/gsap.js`.
- Downloaded real models into `public/models/` (see early attribution; models evolved — check `ATTRIBUTION.md`).
- Shared sticky **ProductStage** (later archived).
- Hub at `/` linking concepts.

### How to run
```bash
npm install
npm run dev
```

---

## 2026-07-12 — Sketchfab-style hotspots + DOF bokeh

### Theory → build
1. **Annotations**: numbered pins projected from 3D focus points (`data-hotspot`). Click tweens camera to that part’s `data-look`, punches shallow DOF, then scrolls the matching beat into view.
2. **Bokeh / focus**: `EffectComposer` + `BokehPass` (v1 ProductStage). Focus distance = camera→subject.

### Also
- Widened feature-card ScrollTrigger window so **02+** stay visible longer.
- Hotspots 1–8 on Suit + F1 films (v1).

---

## 2026-07-12 — Replicate film for all 4 downloaded models

Routes (shared film components, now mostly archive/secondary):
- `/iron-man` — Mark 85 (now v3)
- `/iron-man-body` — Mark 85 body mesh
- `/f1` — Aston Martin AMR23 (now v3)
- `/f1-w13` — Mercedes W13 concept

---

## 2026-07-12 — Expand Suit + F1; park Watch

### Downloads wired
- F1: **Aston Martin AMR23** (`f1-amr23.glb`) + spare W13
- Iron Man body alternate on disk
- Watch de-emphasized on hub + nav

### Content
- 9 feature beats each + HUD telemetry (annotation configs in `src/lib/annotations/`)

---

## 2026-07-12 — Wired user Mark 85 downloads

Found in `~/Downloads`:
- `iron_man_mark_85.glb` (~194 MB) → `public/models/iron-man.glb`
- Later: `iron-man_mark_85__rigged.glb` → optimized `iron-man-rigged.glb` (v3 active)

---

## 2026-07-12 — AirPods-style feature zooms + camera system

### Done
- **Camera system**: `data-look="az,el,zoom,tx,ty,tz,fov"` — focus point + FOV for macros.
- Feature beats + spin freeze on inspect.
- Annotation configs: `src/lib/annotations/{iron-man,f1}.js`.

---

## 2026-07-12 — Full GSAP product films (v1 era)

### Done
- Shared FX kit (`src/lib/productEffects.js`): SplitText, Scramble, DrawSVG, Physics2D.
- Dense HUD overlays on Suit / F1 / Watch films (ProductStage era).

---

## 2026-07-12 — Fix: models vanishing / invisible

### Bugs
1. Sticky unstick — canvas parent only `100vh`.
2. Bad camera distances after fit.
3. Vite 504 Outdated Optimize Dep.

### Fixes
- Tall experience wrapper; auto-frame from bounding sphere; clear `.vite` cache.

---

## Decision log
| Date | Decision | Why |
| --- | --- | --- |
| 2026-07-12 | Build all three V1s in parallel | Compare which story feels strongest before committing polish |
| 2026-07-12 | Three.js canvas + GSAP ScrollTrigger | Full camera control for Apple-style scroll films |
| 2026-07-12 | Real GLBs only | User requirement; attribution over homemade placeholders |
| 2026-07-12 | Auto-fit camera from bounds | Per-model hardcoded distances broke after normalize |
| 2026-07-12 | Archive ProductStage; ship Garage3D v3 | Monolith unfixable; hybrid GSAP+3D wins |
| 2026-07-12 | Studio HDRI reflections only | Skylight plates blew out materials |
| 2026-07-12 | Source schematics/assets online | User: don’t invent placeholders when assets exist |
| 2026-07-12 | Mixamo-rigged IM + procedural bone poses | File has skeleton but no clips |

---

## 2026-07-12 — GitHub, craft research, Active Theory polish

### Repo
- `.gitignore` excludes large `public/models/*.glb` + `_src/`; restore via `public/models/README.md`.
- Remote → `https://github.com/RDX-Rajat-Savdekar/astro-gsap`.
- Craft research in `report.md`.

### Active Theory study → implemented (v1, carried into v3 HUD)
Inspiration: [activetheory.net](https://activetheory.net/).

| Steal | Implementation |
|-------|----------------|
| Real environment worlds | Poly Haven HDRIs (later: env-only in v3) |
| Camera feel | Lerp + authored looks |
| Minimal chrome | Contextual HUD |
| Film grade | Grain + vignette |
| Contextual UI | Hotspots only on active part |

### Decisions
| Decision | Why |
|----------|-----|
| Keep live GLTF (not only frame sequences) | Models are the differentiator |
| GLBs gitignored, HDRIs in repo | Size |
| Hybrid v3 for submission direction | GSAP craft + 3D interest |

### Next (still open)
1. Webflow Cloud deploy.
2. Optional Mixamo clip bake; optional better AMR23 parts GLB.
3. Pick one URL for contest “really lands” polish.
