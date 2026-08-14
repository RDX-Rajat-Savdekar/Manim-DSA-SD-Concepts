# Video production playbook

> **Scope:** Portfolio / resume explainer videos in this repo — **any project**, not just Aura.  
> **Use case:** Manim (or hybrid) explainers with optional phone VO, ffmpeg assembly, no Resolve required.

**Start here** when a new agent or a new portfolio video begins.

---

## Read order

| # | Doc | When |
|---|-----|------|
| 1 | [00-QUICK-START.md](00-QUICK-START.md) | Whole pipeline on one page |
| 2 | [04-AGENT-ONBOARDING.md](04-AGENT-ONBOARDING.md) | Before writing Manim |
| 2b | [MANIM-AGENT-LESSONS.md](MANIM-AGENT-LESSONS.md) | **Required** — Manim footguns (text, portrait, labels) |
| 3 | [01-MANIM-CHAPTER-PIPELINE.md](01-MANIM-CHAPTER-PIPELINE.md) | Multi-chapter / act-based videos |
| 4 | [02-VO-RECORDING-AND-SYNC.md](02-VO-RECORDING-AND-SYNC.md) | Phone VO → final MP4 |
| 5 | [07-NEW-PROJECT-SETUP.md](07-NEW-PROJECT-SETUP.md) | Adding a new resume project |
| 6 | [03-TOOLS-REFERENCE.md](03-TOOLS-REFERENCE.md) | CLI lookup |
| 7 | [05-LESSONS-LEARNED.md](05-LESSONS-LEARNED.md) | Mistakes to avoid |
| 8 | [06-REPO-LAYOUT.md](06-REPO-LAYOUT.md) | Where things live in this repo |

---

## Registered projects

| Project | Type | Playbook entry |
|---------|------|----------------|
| **Aura design video** | Long Manim + VO (ch 0–9) | [projects/aura-design-video.md](projects/aura-design-video.md) |
| **Aura 60s clip** | Short Manim + B-roll + music | [projects/aura-60s.md](projects/aura-60s.md) |
| **Celestia presentation** | Manim deck (OpenGL, clip-per-scene) | [projects/celestia-presentation.md](projects/celestia-presentation.md) |
| **DSA toolkit** | Reusable Manim library + sample scenes | [projects/dsa-toolkit.md](projects/dsa-toolkit.md) |
| **Interview shorts** | IG vertical Manim + Gemini TTS | `projects/interview-shorts/` — see [MANIM-AGENT-LESSONS.md](MANIM-AGENT-LESSONS.md) |

Add a row + `projects/<name>.md` for each new portfolio video.

---

## Journals (project-specific history)

Chronological “what we tried / what shipped” logs live **per project**, not in this folder:

| Project | Journal |
|---------|---------|
| Aura (all Aura videos) | [`Aura/journal.md`](../../Aura/journal.md) |
| Celestia | `celestia_presentation/notes/` + add journal when needed |
| New project | `{project}/journal.md` — see [JOURNAL-TEMPLATE.md](JOURNAL-TEMPLATE.md) |

This playbook = **process**. Journals = **history**.

---

## Shared tooling (today)

The full VO mux pipeline is implemented under **`Aura/design-video/tools/`** (reference implementation from the Aura design video). New projects can:

1. **Reuse as-is** — point tools at your project's paths (see [07-NEW-PROJECT-SETUP.md](07-NEW-PROJECT-SETUP.md)), or  
2. **Copy** `tools/` + `vo/` patterns into your project folder later.

No DaVinci Resolve required for the ffmpeg path in [02-VO-RECORDING-AND-SYNC.md](02-VO-RECORDING-AND-SYNC.md).
