# Manim — agent lessons (read before coding)

> **Mandatory for every agent** touching Manim in this repo.  
> Distilled from real shorts/portfolio work (incl. interview-shorts response-time).  
> Also see: [05-LESSONS-LEARNED.md](05-LESSONS-LEARNED.md), [04-AGENT-ONBOARDING.md](04-AGENT-ONBOARDING.md).

---

## Before you hand work to the user

1. Render `-ql` / low-res **portrait or project aspect** first  
2. Extract frames with ffmpeg; **open the PNGs and inspect yourself**  
3. For interview shorts: run `qa_safe_overlay.py` on mid + late frames — fix anything in the red gutters  
4. Fix overlap, kerning, clipping, unreadably small text  
5. Only then `-qh` / 4K / VO mux  

Do **not** ask the user to QA basic layout.

---

## Interview shorts — production gates (critical)

Channel: `projects/interview-shorts/`. Cursor rule: `.cursor/rules/interview-shorts.mdc`.

### 1. VO-first (hard gate)

```
script.txt → Gemini TTS (Puck) → ffprobe duration → animate to VO → mux → posted/
```

- **No 4K / final mux** until `output/vo_puck.wav` (or locked voice) exists and duration is known.  
- Visuals-first caused video/VO length mismatches — do not repeat.  
- Host voice: **Puck** (`projects/interview-shorts/voice/LIKED_VOICES.md`).

### 2. Canonical render recipe

Use the helper (do **not** invent flags — bare `-qh` can land at **60fps**):

```bash
# from e.g. shorts/01-response-time/
../../tools/render_short.sh scenes/response_time.py ResponseTimeBreakdown preview
../../tools/render_short.sh scenes/response_time.py ResponseTimeBreakdown final   # 2160×3840 @ 30fps
../../tools/render_short.sh scenes/response_time.py ResponseTimeBreakdown ig      # 1080×1920 upload master
```

Mux:

```bash
../../../../.venv/bin/python ../../tools/mux_vo.py \
  --video output/video_4k.mp4 \
  --audio output/vo_puck.wav \
  --out output/final_*_puck.mp4
```

Keep 4K masters locally; prefer **1080×1920** for Instagram upload if size/compression bites.

### 3. Minimum type sizes (phone-arm)

Usable canvas is smaller after safe zone — labels drift too small. Floors (`safe_zone.MIN_*`):

| Role | `font_size` ≥ |
|------|----------------|
| Title | **30** |
| Body / punchline | **20** |
| Brace / axis / line tags | **18** |

### 4. Safe-zone QA artifact

```bash
ffmpeg -y -ss <mid> -i output/preview_portrait.mp4 -frames:v 1 output/qa_mid.png
ffmpeg -y -ss <late> -i output/preview_portrait.mp4 -frames:v 1 output/qa_late.png
.venv/bin/python projects/interview-shorts/tools/qa_safe_overlay.py output/qa_mid.png output/qa_late.png
```

Reject the short if any readable text sits in the red overlay regions.

### 5. Content density

- **One concept + one punchline** per short.  
- On-screen: title + diagram labels + punchline — do **not** burn the full VO script (IG auto-captions already eat the bottom).  

---

## Text rendering (critical)

| Mistake | What happened | Fix |
|---------|---------------|-----|
| `Text(..., font="Helvetica Neue")` | Multi-word labels collapsed → `Networklatency`; letters overlapped | Prefer **`DejaVu Sans`** (or omit custom font). Avoid Helvetica Neue in Manim/Pango. |
| Fitting label width to brace span | Squished / warped glyphs | **Never** `set_width` / stretch labels to match a brace. Place text with `next_to`; keep natural aspect. |
| Arranging words with large `buff` to “fix” spacing | Huge gaps (`Network····latency`) | Use one `Text("Network latency")` with a good font — don’t hand-space unless necessary. |
| Relying on Manim text cache after font changes | Old broken glyphs reappear | Clear `media/texts/` (and `media/Text/`) after font/label pipeline changes. |
| Tiny `font_size` (≤16) on dense labels | Looks glitchy at 480p preview | Use ≥18–22 for brace labels; inspect at final resolution too. |
| Scaling a `VGroup` that contains readable `Text` | Kerning / weight look wrong | Size text via `font_size`; scale shapes only. |

**House style for labels:**

```python
Text("Network latency", font="DejaVu Sans", font_size=20, color=ACCENT)
```

---

## Instagram / YouTube Shorts UI safe zone (critical)

Platform chrome **covers** parts of a full-bleed 9:16 frame. Never put labels, arrows, or punchlines under UI.

| Edge | Keep clear | Why |
|------|------------|-----|
| **Top ~12%** | Header / “Reels” / status | |
| **Bottom ~24%** | Caption, username, comment bar, audio | |
| **Right ~18%** | Like / comment / share / save column | |
| **Left ~6%** | Padding | |

**Shared helper:** `projects/interview-shorts/safe_zone.py` → `safe_bounds()` → `(x_min, x_max, y_min, y_max)`.

| Mistake | Fix |
|---------|-----|
| Full-width diagram to frame edges | Lay out inside `safe_bounds()` only |
| Punchline / brackets at `to_edge(DOWN)` | Sit above `y_min` from safe bounds |
| Labels on the right (“Network latency”, axis tags) | Keep left of `x_max` (leave right column empty) |
| QA only in desktop player | Mentally overlay Reels UI, or leave empty right/bottom gutters in preview frames |

**QA checklist add:**
- [ ] Nothing readable in right ~18% or bottom ~24%
- [ ] Title below top safe margin

---

## Instagram / vertical shorts

| Mistake | Fix |
|---------|-----|
| `-ql` alone → landscape 854×480 | Set `config.frame_width = 9` and `config.frame_height = 16` **in the scene module**. Pass `--resolution H,W` as **height,width** (e.g. `480,854` preview, `2160,3840` 4K). |
| Assuming `manim.cfg` pixel size wins over `-ql`/`-qh` | Quality flags **override** cfg pixels. Always pass `--resolution` for portrait. |
| Content under IG/YT Shorts UI | Use `safe_zone.py` — clear top 12%, bottom 24%, right 18% |
| Wrong venv `manim` shebang after repo rename | Use `path/to/.venv/bin/python -m manim ...` |

---

## Sequence diagrams & labels

| Mistake | Fix |
|---------|-----|
| “Request” / “Response” on the arrow shaft | Offset **outside** the V (left of request, right of response), not along the chord midpoint. |
| Brace labels far below the diagram | Keep bracket `y` near the service lane; small `buff`; full “response time” bracket lower only if stacked under others. |
| `BraceBetweenPoints` + auto-fitted text | Prefer explicit underline/bracket `Line`s + independent `Text`, or brace **without** width-fitting the label. |
| Dots for Client/Service | Use SVG icons (`SVGMobject`); set color/height; don’t scale text with the icon group carelessly. |

---

## Story / pacing for explainers

| Mistake | Fix |
|---------|-----|
| Building every piece left→right | For “what’s inside X”: show **simple outer shape first**, then **expand** the middle and reveal parts. |
| 45s for one diagram short | Target ~20s; `run_time` 0.4–0.6s; short holds; spend time on the expand. |
| VO longer than video → cut audio with `-shortest` | Freeze last frame (`tpad=stop_mode=clone`) to match VO, or lengthen waits after measuring VO. |

---

## Gemini TTS (interview shorts)

| Mistake | Fix |
|---------|-----|
| Expecting Studio-like speed for 4 long samples | CLI is sequential + full style prompt + waits for full WAV. Use `--no-style` / short text for A/B. |
| Pasting API keys in chat | Put key in repo-root `.env` (`GEMINI_API_KEY=`); never commit. Rotate if exposed. |
| Unstable brand voice | **Host = Puck.** Shortlist in `voice/LIKED_VOICES.md`. |
| Animate before VO | **VO-first gate** — see above. |
| Bare `manim -qh` for portrait | Use `tools/render_short.sh` (`--fps 30` locked). |

---

## Render & QA checklist (shorts)

- [ ] `script.txt` written; **Puck VO** generated; duration known (`ffprobe`)  
- [ ] Portrait frame config (`9×16`) set in scene file  
- [ ] Content inside **Shorts/Reels safe zone** (`safe_zone.py`)  
- [ ] Type sizes ≥ title 30 / body 20 / tags 18  
- [ ] Preview via `render_short.sh … preview`  
- [ ] Mid + late frames + **`qa_safe_overlay.py`** inspected (nothing in red)  
- [ ] Final via `render_short.sh … final` (2160×3840 @ **30fps**)  
- [ ] Mux with `mux_vo.py` (freeze-pad); copy to `posted/` when ready  
- [ ] Output under project `output/` (not only `media/`)  

---

## Commands (this repo)

```bash
# Preview portrait (preferred)
projects/interview-shorts/tools/render_short.sh scenes/foo.py SceneName preview

# Equivalent manual flags
.venv/bin/python -m manim scenes/foo.py SceneName -ql --resolution 480,854 --fps 15

# 4K vertical @ 30fps
.venv/bin/python -m manim scenes/foo.py SceneName -qh --resolution 2160,3840 --fps 30

# Clear bad text cache after font changes
rm -rf media/texts media/Text

# Safe-zone overlay QA
.venv/bin/python projects/interview-shorts/tools/qa_safe_overlay.py output/qa_late.png
```
---

## When you learn a new Manim footgun

Append a row to the matching table above in **this file**, and a one-liner to [05-LESSONS-LEARNED.md](05-LESSONS-LEARNED.md). Do not bury it only in a project journal.
