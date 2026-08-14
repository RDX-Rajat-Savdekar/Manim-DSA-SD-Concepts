# 01 — Response time breakdown

Instagram short: animate client→service timeline (expand-middle story).

- Plan: [BEATS.md](BEATS.md)
- VO script: [script.txt](script.txt)
- Tool: **Manim** (vertical 1080×1920 / 4K 2160×3840)
- Agent lessons: [`docs/video-production/MANIM-AGENT-LESSONS.md`](../../../../docs/video-production/MANIM-AGENT-LESSONS.md)

## Outputs

| File | What |
|------|------|
| `output/final_response_time.mp4` | **Final** — 4K + Charon VO (~32.6s) |
| `output/video_4k.mp4` | Silent 4K Manim render |
| `output/vo_charon.wav` | Gemini TTS (Charon) |

```bash
# Remux after re-render
../../../../.venv/bin/python ../../tools/mux_vo.py \
  --video output/video_4k.mp4 \
  --audio output/vo_charon.wav \
  --out output/final_response_time.mp4
```
