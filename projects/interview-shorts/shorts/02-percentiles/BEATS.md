# Short 02 — Average, median, percentiles

## Tool: Manim · VO-first

Format: Instagram vertical **1080×1920** / 4K **2160×3840**  
Voice: **Puck** (locked from short 01)  
Target: **~27s** (locked to `output/vo_puck.wav` ≈ **27.05s**)

---

## Story

Response times are a **distribution**, not one number.
1. Show many requests as bars (outliers visible)
2. Reveal **median (p50)** — typical user wait
3. Reveal **mean** — pulled up by outliers (not “typical”)
4. Reveal **p95 / p99** — the slow tail users feel
5. Punchline: use percentiles for user experience; mean for capacity estimates

---

## Beats (timed after VO)

| # | On screen | VO cue |
|---|-----------|--------|
| 0 | Title | Hook |
| 1 | Axes + ~40–60 request bars grow in | Distribution / jitter |
| 2 | **Median (p50)** dashed line | Half faster, half slower |
| 3 | **Mean** solid line (above median) | Outliers pull average up |
| 4 | **p95** then **p99** lines | Tail latency |
| 5 | Callout: mean ≠ typical | Punchline |
| 6 | Hold | End |

Exact waits set after `vo_puck.wav` duration is known.

---

## Pipeline

1. Lock `script.txt`  
2. Generate VO → `output/vo_puck.wav`  
3. `ffprobe` duration → fill waits in Manim  
4. Preview → 4K → mux → `posted/`
