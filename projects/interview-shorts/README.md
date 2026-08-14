# Interview Shorts — Gemini TTS

Calm explainer voiceovers for Instagram interview-prep shorts
(LeetCode · system design · concepts).

## Layout rule (Reels / Shorts UI)

Keep all readable content inside `safe_zone.py` margins (top 12% / bottom 24% / right 18% / left 6%).  
Details: [`docs/video-production/MANIM-AGENT-LESSONS.md`](../../docs/video-production/MANIM-AGENT-LESSONS.md).

**Gates:** VO-first (Puck) → preview → safe-zone overlay QA → `tools/render_short.sh … final` → mux → `posted/`.

## 1. API key (once)

1. Create a key: https://aistudio.google.com/apikey
2. At the **repo root**, create `.env`:

```bash
cp projects/interview-shorts/.env.example .env
# then edit .env and paste your key
```

```
GEMINI_API_KEY=your_key_here
```

## 2. Install

From repo root (uses the shared `.venv`):

```bash
uv pip install google-genai
# or: .venv/bin/pip install google-genai
```

## 3. Generate VO

```bash
# sample script → output/vo/sample_load_balancer_charon.wav
.venv/bin/python projects/interview-shorts/tools/generate_tts.py \
  --file projects/interview-shorts/scripts/sample_load_balancer.txt

# inline text
.venv/bin/python projects/interview-shorts/tools/generate_tts.py \
  --text "A cache sits in front of the database to answer popular reads fast."

# try another calm voice
.venv/bin/python projects/interview-shorts/tools/generate_tts.py \
  --file projects/interview-shorts/scripts/sample_load_balancer.txt \
  --voice Schedar

# longer / more stable narration
.venv/bin/python projects/interview-shorts/tools/generate_tts.py \
  --file projects/interview-shorts/scripts/sample_load_balancer.txt \
  --model gemini-2.5-pro-preview-tts
```

Default voice: **Charon** (informative). Style prompt: `voice/narrator_style.txt`.

## Voices worth A/B testing

| Voice | Feel |
|-------|------|
| Charon | informative (default) |
| Schedar | even / flat-calm |
| Sadaltager | knowledgeable |
| Rasalgethi | informative alt |
| Iapetus | clear |

```bash
.venv/bin/python projects/interview-shorts/tools/generate_tts.py --list-voices
```

## Preview in AI Studio

https://aistudio.google.com → speech / TTS playground (try Charon + your style notes before locking a brand voice).
