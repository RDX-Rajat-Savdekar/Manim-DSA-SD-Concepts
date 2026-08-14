# Agent onboarding — portfolio videos

Rules for **any** Manim portfolio project in this repo. Then read that project's `docs/video-production/projects/<name>.md`.

---

## Read first

1. [README.md](README.md) — playbook index + project registry  
2. [00-QUICK-START.md](00-QUICK-START.md)  
3. [MANIM-AGENT-LESSONS.md](MANIM-AGENT-LESSONS.md) — **required before Manim** (text/portrait/label footguns)  
4. **Project entry** — e.g. [projects/aura-design-video.md](projects/aura-design-video.md)  
5. **Project journal** — e.g. [Aura/journal.md](../../Aura/journal.md) (latest entry)

---

## Before handing work to the user

1. Render changed scenes at low quality first (`-ql` or project default)  
2. Extract layout frames if the project supports it — **inspect PNGs yourself**  
3. Fix clipping, overlap, kerning, unreadable text  
4. Only then final quality / report to user  

**Do not ask the user to QA basic layout.**

---

## Universal Manim rules

| Rule | Detail |
|------|--------|
| Visual-first *(long portfolio)* | Ship with default waits; tune after VO |
| **VO-first *(interview shorts)*** | Script → Puck VO → animate to audio — see [MANIM-AGENT-LESSONS.md](MANIM-AGENT-LESSONS.md) |
| One beat per file | Prefer act/scene files over monoliths while iterating |
| Plan in markdown | PLAY CHECKLIST or notes before heavy code gen |
| Measured timing | ffprobe rendered MP4s, not plan targets |
| ffmpeg concat | Absolute paths in list files |
| VO mux | Hold last **content** frame — never extend black after FadeOut |
| Honesty doc | Read STORY/HACKATHON/facts before claiming outcomes |

Project-specific typography/layout rules override (e.g. Aura `MANIM-STANDARDS.md`, interview-shorts `safe_zone.py`).

---

## Interview shorts

| Item | Location |
|------|----------|
| Project | `projects/interview-shorts/` |
| Cursor rule | `.cursor/rules/interview-shorts.mdc` |
| Safe zone | `safe_zone.py` + overlay QA tool |
| Render | `tools/render_short.sh` |
| Lessons | [MANIM-AGENT-LESSONS.md](MANIM-AGENT-LESSONS.md) (VO-first + UI gutters) |

---

## VO / final assembly

- Resolve **not required** — use mux toolkit ([02-VO-RECORDING-AND-SYNC.md](02-VO-RECORDING-AND-SYNC.md))  
- Whisper for speech bounds + script QA  
- Chapter banners optional (`--banner`)

---

## New project

Follow [07-NEW-PROJECT-SETUP.md](07-NEW-PROJECT-SETUP.md) — add `projects/<name>.md` + `{project}/journal.md`.

---

## Cursor rules (repo)

| Rule file | Scope |
|-----------|--------|
| `.cursor/rules/aura-manim.mdc` | Aura design-video ch 6+ only |
| `.cursor/rules/interview-shorts.mdc` | IG/YT vertical shorts + Gemini TTS |

Add new `.cursor/rules/*.mdc` per project when standards stabilize.
