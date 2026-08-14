# Gemini voices I like

Locked shortlist for PrepFrames / interview shorts VO.

## Brand host (locked)

**Puck** — use for all posted shorts unless the user explicitly A/B’s another voice.

## Liked voices (A/B only)

| Voice | Notes |
|-------|-------|
| Umbriel | liked |
| Sadaltager | liked |
| Gacrux | liked — female |
| Aoede | liked — female |
| Puck | **host (locked)** |
| Charon | liked (CLI sample default) |
| Algieba | liked |
| Algenib | liked |

## Male-only shortlist (for brand host)

- **Puck** ← default
- Umbriel
- Sadaltager
- Charon
- Algieba
- Algenib

## Female shortlist (optional / guest / alt series)

- Gacrux
- Aoede

## Generate with CLI

```bash
.venv/bin/python projects/interview-shorts/tools/generate_tts.py \
  --file projects/interview-shorts/shorts/01-response-time/script.txt \
  --voice Puck
```
