# Product film craft — research & plan

Date: 2026-07-12  
Project: Astro × GSAP × Webflow Cloud hackathon (Suit / F1 product films)

> **Status (2026-07-12 evening):** Implementation moved to **v3 hybrid** (`/f1`, `/iron-man` + `src/lib/garageStage`). This report remains the craft research / industry context. For current architecture and handoff see [`AGENTS.md`](AGENTS.md), [`journal.md`](journal.md), [`docs/REBUILD_F1_IRONMAN.md`](docs/REBUILD_F1_IRONMAN.md).

This report answers: **how is what we’re trying to do done officially?** We’re currently inventing a lot of it. Below is what the industry actually does, what we’ve already approximated, and a concrete plan to close the gap.

---

## 1. What we’re trying to do (problem statement)

Build a **scroll-driven product film**:

1. Sticky product stays on screen while the user scrolls.
2. Camera / framing **zooms into one part at a time** (AirPods-style feature beats).
3. Copy is minimal: one kicker, one headline, one sentence, optional specs.
4. Optional **numbered hotspots** that jump the camera to a part (Sketchfab-style).
5. Optional **cinematic focus / bokeh** so close-ups feel like a real lens.

Stack constraint: Astro + GSAP (all plugins) + real GLBs + Webflow Cloud.

---

## 2. How Apple does it (official / documented practice)

### 2.1 The classic technique is **not** live WebGL

Apple’s famous pages (AirPods Pro / Max era) mostly use:

- A **pinned viewport**
- A **canvas**
- A **pre-rendered image (or video) sequence**
- Scroll progress → frame index

Documented recreations:

- [CSS-Tricks — Apple-style scrolling animations](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- [GSAP Vault — scroll image sequences](https://gsapvault.com/blog/scroll-image-sequence-tutorial)
- [Builder.io — 3D scroll with GSAP](https://www.builder.io/blog/3d-gsap)

**Art direction implication:** Apple often **pre-lights and pre-composes** every frame in a 3D/VFX pipeline, then scrubs those frames. That guarantees:

- Perfect materials / reflections
- Zero runtime GLB cost
- Exact camera path designed by art, not improvised in JS

AirPods Max One Show write-up: they chose **scrollable high-fidelity video/frames instead of a WebGL model** specifically for richer rendering ([One Show — AirPods Max](https://www.oneclub.org/awards/theoneshow/-award/38768/airpods-max-product-site/)).

### 2.2 Apple’s internal “Flow” system

Public reverse-engineering notes ([Graydon Pleasants — Flow](https://graydonpleasants.com/posts/flow-apples-secret-weapon/)):

- Custom compressed frame sequences
- Decode → textures → WebGL shaders
- Scroll + RAF drive playback
- Device / breakpoint variants; mobile often simplified

### 2.3 Newer Apple shift toward real 3D

Same article notes Apple moving toward **GLTF / USDZ** on newer sites (e.g. Vision Pro), reusing AR assets. So **both** approaches are “official” Apple paths:

| Era / page type | Technique |
|-----------------|-----------|
| AirPods Pro / Max classic | Frame sequence / Flow |
| Newer AR-linked products | Real GLTF/USDZ + runtime camera |

**We’re closer to the newer GLTF path**, not the classic frame-sequence path.

### 2.4 Art / copy rules Apple repeats (design system, not code)

From AirPods Max case + observing product pages:

1. **One idea per scroll beat** — never two features at once.
2. **Product is the hero**; type is secondary.
3. **Macro → meaning** — zoom is motivated by a benefit (noise canceling, materials), not decoration.
4. **Studio lighting language** — soft key, controlled reflections, quiet backgrounds.
5. **Theme shifts** for emotional sections (e.g. white → black for “immersion”).
6. **Mobile fallback** — often less motion / static hero on small or reduced-motion devices.

---

## 3. How Sketchfab does hotspots + focus (official API)

### 3.1 Annotations anatomy ([devfab.io guide](https://www.devfab.io/guide/annotations/))

1. **Hotspot** — numbered marker stuck in 3D space  
2. **Annotation note** — title/body revealed on focus  
3. **Annotation menu** — list to jump between beats  

### 3.2 Viewer API ([Sketchfab Viewer functions](https://sketchfab.com/developers/viewer/functions))

Official building blocks:

- `createAnnotation` / `createAnnotationFromWorldPosition` — store **position + camera eye + camera target + title + text**
- `gotoAnnotation(index)` — animate camera to that stored shot
- Events like `annotationFocus`

**Key insight we partially reinvented:** a hotspot is not just a screen pin — it’s a **saved camera shot** (`eye` + `target`) bound to a world point. Our `data-look` + `data-hotspot` is a homemade version of that schema.

### 3.3 Post-processing / focus

Sketchfab’s viewer exposes post-processing filters (including DOF-like looks) as a first-class viewer feature. Official Three.js equivalent:

- [EffectComposer](https://threejs.org/docs/pages/EffectComposer.html)
- [BokehPass](https://threejs.org/docs/pages/BokehPass.html)
- [Manual: post-processing](https://threejs.org/manual/en/how-to-use-post-processing.html)

Best practice: DoF for **hero close-ups only**; keep deep focus on wide establishing shots. Pass order: `RenderPass` → depth effects → bloom → grade → AA → `OutputPass`.

---

## 4. How GSAP expects this to be built (official)

From [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) + product-film tutorials:

1. **Pin** (or sticky equivalent) for the stage  
2. **Scrub** timelines (`scrub: true | number`) — let **native scroll** drive progress; don’t scroll-jack  
3. **Long scroll distance** for cinematic pacing (`end: "+=3000"` / tall sections)  
4. **Snap** when you need discrete beats (optional)  
5. **`prefers-reduced-motion`** → static frame / no scrub  
6. SplitText / ScrambleText for typography polish (we already use)

GSAP’s mental model for Apple pages: **scroll progress is the playhead**.

---

## 5. Where we are today (honest gap analysis)

| Capability | Industry pattern | Our project now | Gap |
|------------|------------------|-----------------|-----|
| Feature zoom storytelling | Frame sequence **or** scripted GLTF camera | Live Three.js + `data-look` scrub | Good direction; lighting/path still ad-hoc |
| One idea per beat | Art-directed copy + macro | Feature cards | OK; still too “explainer” in places |
| Hotspots | Sketchfab annotation = point + eye + target + note | Numbered HTML pins + look tween | Missing rich note panel + mesh-glued picks |
| Bokeh | Viewer filter / BokehPass | BokehPass wired to zoom | Needs artist-tuned aperture curves + disable on mid devices |
| Performance | Draco/meshopt, LODs, compressed frames | Raw 44–194MB GLBs | **Critical** for deploy |
| Mobile | Static / reduced sequence | Sticky 3D everywhere | Need fallback |
| Art direction | Pre-lit frames or studio HDRIs | RoomEnvironment default | Need custom HDRI + grade |
| Accessibility | Reduced motion | Not implemented | Required |

---

## 6. Recommended north star for *this* hackathon

Given time + GSAP/Webflow judging:

**Stay on live GLTF** (our models are the differentiator), but **steal Apple’s art rules** and **Sketchfab’s annotation data model**.

Do **not** rebuild full AirPods frame sequences unless we pick one hero sequence later — it’s a different production pipeline (Blender/Cinema renders × hundreds of frames).

Winning combination:

1. One hero model (Mark 85 **or** AMR23), compressed  
2. Annotation shots authored as data (not magic numbers sprinkled in JSX)  
3. Scroll scrub = default tour; click hotspot = jump to shot  
4. Shallow DOF only on close beats  
5. Ruthless typography + lighting polish  

---

## 7. Implementation plan (phased)

### Phase A — Foundation (do next)

1. **Compress models** — gltf-transform with Draco/meshopt; target &lt;15MB hero, &lt;30MB absolute max.  
2. **Models outside git** — already planned via `.gitignore`; document restore steps in `public/models/README.md`.  
3. **Annotation config file** — e.g. `src/lib/annotations/iron-man.js`:

   ```js
   { id: 2, label: "Helmet HUD",
     position: [x,y,z],
     eye: […], target: […],
     title, body, scrollSection: "#helmet" }
   ```

   Matches Sketchfab’s mental model (`position` + `eye` + `target`).  
4. **`prefers-reduced-motion`** — disable scrub, DOF, spin; show static hero + list of features.  
5. **Device gate** — if mobile / low GPU: hide DOF, lower DPR, optional static poster.

### Phase B — Art direction

1. Replace `RoomEnvironment` with a **studio HDRI** (Poly Haven studio / softbox).  
2. Add subtle **grade** pass (lift blacks, warm key for Suit; cool teal for F1).  
3. Rewrite copy to **benefit language** (“Silence the cabin” not “Sidepods cooling sculpture”).  
4. One accent motion per beat only (DrawSVG **or** particles **or** scramble — not all).  
5. Define a **shot list** on paper before more code (wide → 6 macros → hero pullback).

### Phase C — Interaction (Sketchfab parity)

1. Hotspot click opens a **note card** (title + 1–2 lines), not only camera move.  
2. Optional raycast pick on mesh to place/edit annotations in a “studio mode”.  
3. Annotation menu strip (1–8) always visible on desktop.  
4. Sync active annotation with scroll (`annotationFocus` equivalent).  

### Phase D — Optional “true Apple” upgrade (only if we pick one winner)

1. Render a **60–120 frame** sequence of the best camera path from Blender.  
2. GSAP ScrollTrigger scrub on canvas for that one hero section.  
3. Keep live GLTF for interactive hotspot section only.

### Phase E — Ship

1. Single URL entry (hub → one primary film).  
2. Webflow Cloud deploy.  
3. Performance budget: LCP &lt; 2.5s on broadband with compressed GLB + poster.

---

## 8. Immediate next 5 engineering tasks (ordered)

1. ~~Compress Mark 85 + AMR23; wire compressed paths.~~ **Done** — meshopt + simplify; body 165MB→1MB (was ~5M tris). `npm run optimize:models`. Loader uses `MeshoptDecoder`.  
2. ~~Move look/hotspot numbers into annotation config modules.~~ **Done** — `src/lib/annotations/{iron-man,f1}.js`.  
3. ~~Add reduced-motion + mobile DOF kill-switch.~~ **Done** — static camera + no DOF when `prefers-reduced-motion` / coarse mobile.  
4. Studio HDRI + tone pass; kill competing FX on each beat.  
5. Pick **one** film (Suit vs F1) and polish only that to submission quality.

---

## 9. Sources

- [CSS-Tricks — Apple product scroll animations](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)  
- [GSAP Vault — Apple-style scroll image sequences](https://gsapvault.com/blog/scroll-image-sequence-tutorial)  
- [Builder.io — 3D scrolling with GSAP](https://www.builder.io/blog/3d-gsap)  
- [One Show — AirPods Max product site](https://www.oneclub.org/awards/theoneshow/-award/38768/airpods-max-product-site/)  
- [Graydon Pleasants — Apple Flow](https://graydonpleasants.com/posts/flow-apples-secret-weapon/)  
- [Sketchfab Viewer API — Annotations](https://sketchfab.com/developers/viewer/functions)  
- [devfab.io — Annotations overview](https://www.devfab.io/guide/annotations/)  
- [three.js — EffectComposer](https://threejs.org/docs/pages/EffectComposer.html)  
- [three.js — BokehPass](https://threejs.org/docs/pages/BokehPass.html)  
- [three.js manual — post-processing](https://threejs.org/manual/en/how-to-use-post-processing.html)  
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)  

---

## 10. Bottom line

We’ve been coding **toward** the right product (live 3D tour + feature macros). Official practice says:

- Apple’s *look* usually comes from **art-directed frames** or carefully authored **camera shots**, not improvised orbit math.  
- Sketchfab’s *interaction* is a **data model**: hotspot + camera eye/target + note.  
- GSAP’s *engine* is **scroll = playhead**.

Next work should be less “add more effects” and more **author shots like a DP**, **compress assets**, and **match the annotation schema** — then polish one film to win.

---

## 11. Active Theory inspiration ([activetheory.net](https://activetheory.net/))

Deep study notes live in the Cursor canvas `active-theory-study.canvas.tsx`. Summary:

### What they actually ship
- Full-viewport **#Stage** WebGL app (Hydra engine) — not a marketing page with a canvas widget.
- Designer JSON (**UIL**): cameras as `position / lookAt / fov / lerpSpeed / moveXY / wobble`; materials as KTX2 + matcaps; particles as tuned uniforms.
- Type: **NB Architekt**. Chrome: minimal velocity-reactive pill nav ([CommArts interview](https://www.commarts.com/webpicks/active-theory-2)).
- **~80% of calendar = polish.**

### Product-film parallel: CHILE20
- Hero garment in **art-directed worlds** (past / present / future), not a void.
- Hi-poly → bake normals → light runtime mesh ([Medium case study](https://medium.com/active-theory/adidas-chile20-4744a75f5968)).
- Multi-world stress: **ping-pong render** (one scene per frame).

### Steal for Suit / F1 (ordered)
1. ~~**Environment world**~~ **Done** — studio HDRI + softbox panels + reflective floor + film grain/grade.  
2. ~~**Camera feel**~~ **Done** — lerp ~0.085 + mouse parallax; macro FOV ~16–17°.  
3. ~~**Asset craft**~~ **Done** — HQ rebuild (~92% keep / 4K webp; body ~22% verts, no meshopt).  
4. ~~**Chrome + polish**~~ **Done** — velocity pill nav; quieter HUD accents.  

Do **not** rebuild Hydra. Keep GSAP + Three; match their art rules and authoring model.

