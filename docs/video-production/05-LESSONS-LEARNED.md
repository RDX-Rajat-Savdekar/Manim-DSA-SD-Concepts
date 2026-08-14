# Lessons learned

Cross-project mistakes from portfolio video work in this repo.  
Project-specific details: per-project journals (e.g. [`Aura/journal.md`](../../Aura/journal.md)).

---

## Manim production

**Full footgun list (agents must read):** [MANIM-AGENT-LESSONS.md](MANIM-AGENT-LESSONS.md)

| Mistake | Fix |
|---------|-----|
| All beats in one Scene | One act/scene per file + layout plop first |
| Hand-drawn icons | SVG assets |
| `VideoMobject` unavailable / brittle | PyAV → `ImageMobject` updaters |
| Scaling groups with `Text` | Typography helpers; size plates, don't scale copy |
| Helvetica Neue / bad Pango fonts | Use `DejaVu Sans`; clear `media/texts/` after font changes |
| Label width-fitted to brace | Never stretch text to brace span |
| `-ql` ignores portrait cfg | Set `frame_width/height` in scene + pass `--resolution H,W` |
| Content under IG/YT Shorts chrome | `projects/interview-shorts/safe_zone.py` — top 12% / bottom 24% / right 18% clear |
| Visuals before VO on narrated shorts | **VO-first** — script → Puck → animate → mux |
| Bare `manim -qh` → 60fps / wrong out dir | `tools/render_short.sh` with `--fps 30` locked |
| Tiny labels after safe-zone shrink | Title ≥30 / body ≥20 / tags ≥18 |
| ffmpeg concat relative paths | **Absolute paths** in list files |
| Blocking on plan duration targets | Visual-first; tune after VO |
| Agent asks user to spot layout | Agent runs frame extract + inspects PNGs |
| Monolith before review workflow | Layout scene before motion scene |

---

## Remotion production

| Mistake | Fix |
|---------|-----|
| CSS transitions (`transition: all`) in elements | Non-pure animation flickering. Drive styles purely via `interpolate` or `spring` mapped to `useCurrentFrame()`. |
| Importing media files from outside the project sandbox | Dev server throws `404`. Copy assets to the local `public/` directory and load them via the `staticFile()` helper. |
| Underscores `_` in composition IDs | Compiler crash. Use alphanumeric keys and hyphens `-` only. |
| Raw arrow symbols (`->`) in JSX | Webpack parse crash. Wrap in curly braces `{"->"}` or use HTML entities `&rarr;`. |
| Nested Canvas wrappers in `@remotion/skia` | Reconciler loop crash (`Should not already be working`). Render elements directly as children of Remotion's `<SkiaCanvas>`. |
| Raw TS library checks in node_modules (`react-native` types) | Compilation crash. Add stubs file `src/react-native-stubs.d.ts` and set `"noUnusedLocals": false` in `tsconfig.json`. |
| WebGL context failure in Chromium headless render | `failed to create webgl context: err 0`. Set `Config.setChromiumOpenGlRenderer("angle")` in `remotion.config.ts`. |

---

## Motion Canvas production

| Mistake | Fix |
|---------|-----|
| Using `delay(seconds)` to pause the animation timeline | TypeScript compiler error. Use `waitFor(seconds)` for simple pauses; `delay` is a timing helper that expects both a duration and a callback task to run. |
| Importing `fork()` from `@motion-canvas/core` for concurrent background tasks | Module build crash. Use `spawn(() => generator)` (and `join` or `cancel` if needed) to run parallel, non-blocking visual animations like heartbeats or packet routers. |
| Writing instant text swaps `.text('val')` or fill resets `.fill('#col')` inside `yield* all(...)` | TypeScript type assignment crash. Instant property updates that lack duration arguments do not return a `ThreadGenerator`. Set them instantly outside/before the `all(...)` block. |
| Assuming subsequent stages are missing when opening the preview editor | Motion Canvas arranges scenes sequentially on the main timeline. Click `Zoom to fit` (or press `F`) and drag the playhead past the first scene's duration threshold. |

---

## VO and pacing

| Mistake | Fix |
|---------|-----|
| SCRIPT.md as timing truth | `vo/sceneN.md` + measured 4K durations |
| Extra pauses in recording for Manim | Trim/hold video, not longer VO silence |
| Resolve required | ffmpeg mux + Whisper |
| Extend video when VO longer → **black** hold | `vo_video_fit.py` — freeze last content frame |
| WAV length Δ vs speech | Whisper `speech_end` |
| Mislabeled act audio | Transcript vs PLAY CHECKLIST |

---

## Act structure (VO mux)

| Pattern | Mux handling |
|---------|--------------|
| `wait` → `FadeOut` | `content_end = duration − fade_run_time` |
| b-roll → blank `wait` | Hold last b-roll frame; strip blank tail |
| b-roll ends with fade | Strip fade; hold last content frame |

---

## Short-form / hybrid

| Mistake | Fix |
|---------|-----|
| EDM music under dense text | Documentary/ambient bed, low volume |
| Teammate VO on solo cut | Mute source; own narration or text only |
| Re-record when no device | Re-cut existing demo footage |

---

## Documentation

| Mistake | Fix |
|---------|-----|
| Decisions only in chat | Project `journal.md` + this playbook |
| Aura-only docs for repo-wide work | **`docs/video-production/`** — generic process |
| Stale act numbers in comments | Fix source + journal |

---

## Honesty (portfolio-wide)

- Match claims to fact records / STORY docs.  
- Separate **integrated** vs **trained**, **prototype** vs **production**.  
- B-roll proves product; Manim explains decisions.
