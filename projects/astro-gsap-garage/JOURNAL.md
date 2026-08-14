# Journal

Short dev log for the Astro × GSAP × Webflow Cloud hackathon build.
Spec lives in `goal.md`. This file is the “what changed / why” trail.

## 2026-07 — Product Stage lab (3D-first)

- Built pinned Three.js Garage3D for `/f1` (AMR23) and `/iron-man` (Mark 85).
- Scroll-scrubbed camera beats + VFX (airflow, thrusters, Mixamo clips).
- Layered 2D GSAP sections (`f1-v2` / `ironman-v2`) as lead-ins to the 3D stage.
- Stack: Astro 6 + GSAP 3.15 + vanilla Three.js (no R3F).

## 2026-07-15 — Hierarchy reverse + ship prep

- **Reversed hierarchy:** 2D GSAP story is now the main site; Garage3D is **Beat 10 · Interactive finale** (compact pin).
- **Visual polish:** kinetic SplitText, schematic icons, ticker strips, grain/vignette atmosphere, ScrollSmoother, F1 sequence scrub on Aero.
- **F1 lighting:** dialed down garage fill (`frontInt: 0`, lower ambient/key/hemi) for a darker studio look.
- **De-bloat:** removed unused GLBs (~140MB), unused HDRIs, `f1-w13` sequence, duplicate `gsap.ts`, car-selector UI.
- **Webflow Cloud:** added `webflow.json` (`framework: "astro"`). Static Astro build matches the official [astro-gsap](https://github.com/Webflow-Examples/astro-gsap) starter — deploy as **New domain** (standalone).

### Deploy (Webflow Cloud)

```bash
# Option A — CLI
npx webflow auth login
npx webflow cloud deploy   # choose "New domain"

# Option B — Dashboard
# Workspace → New Project → App → Import GitHub repo → New domain
```

Mounting later under an existing Webflow site (e.g. `/lab`) would need `@astrojs/cloudflare`, `base` / `assetsPrefix`, and prefixed asset URLs — not required for the hackathon standalone deploy.

### Active routes

| Route | Role |
|-------|------|
| `/` | Hub |
| `/f1` | GSAP story beats + compact F1 finale |
| `/iron-man` | GSAP story beats + compact suit finale |
| `/debug/iron-man-anims` | Dev camera/clip tuner (not linked) |

### Keep vs cut

- **Keep:** `f1-amr23-parts.glb`, `iron-man-rigged.glb`, `mixamo-anims.glb`, `studio_small_09_1k.hdr`, sequences `f1-amr23` + `iron-man`.
- **Cut:** alternate cars, legacy Iron Man GLBs, warehouse/garage HDRIs, car-selector experiment.
