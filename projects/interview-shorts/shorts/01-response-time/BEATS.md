# Short 01 — Response time breakdown

## Tool: Manim

Format: Instagram vertical **1080×1920**, target **~20–24s**.

---

## Story structure (important)

**Not** left-to-right build of every piece.

Instead:

1. **Simple first** — Client ↔ Service as a clean round trip: Request + Response = **two network latencies** only. Middle looks empty / compressed.
2. **Expand the gap** — Slowly stretch the space *between* the two network hops (edges push outward).
3. **Reveal insides one by one** — As the middle opens, show **queueing delay**, then **processing / service time**.
4. **Zoom out to total** — Full bracket: **response time** = both latencies + everything in the middle.

Visual metaphor: the “thin” request→response timeline inflates so you can see what was hidden in the middle.

---

## Beats

| # | Time | On screen | VO |
|---|------|-----------|-----|
| 0 | 0.0–1.5s | Title / Client + Service lanes | Hook |
| 1 | 1.5–4.0s | **Request** arrow + **Response** arrow only (tight middle) | Round trip looks simple |
| 2 | 4.0–6.0s | Label both hops: **Network latency** ×2 | Name the edges |
| 3 | 6.0–9.0s | **Expand** — gap between request-arrival and response-depart grows; edges slide apart | “But wait — something happens in between” |
| 4 | 9.0–12.0s | Queue segment appears in the opened gap → **Queueing delay** | Waiting before work |
| 5 | 12.0–15.5s | Gap expands a bit more → **Processing** box → **Service time** | Actual work |
| 6 | 15.5–18.5s | Optional tiny post-process beat if needed; settle layout | — |
| 7 | 18.5–22.0s | Bottom bracket: full **Response time** + punchline | Sum of edges + middle |

### Animation notes
- Phase 1 layout: request and response almost meet — middle width ≈ 0.3–0.5 of final.
- Expansion: `animate` lane markers / arrow endpoints sliding apart over **~2.5–3s** (ease-out), not a hard cut.
- Inner pieces **FadeIn / GrowFromCenter** only *after* enough gap exists for them.
- Brackets for queueing + service appear with each inner reveal; the big response-time bracket only at the end.
- Keep run_times short (0.4–0.6s) for draws; spend time on the **expand**.

---

## Scene

`ResponseTimeBreakdown`

Mobject phases:
1. `lanes`, `request_arrow`, `response_arrow`, `latency_labels` (compressed)
2. `expand_middle` animation (targets: service-side span, bracket anchors)
3. `queue_segment` + `queue_bracket`
4. `processing_box` + `service_bracket`
5. `response_time_bracket` + punchline

---

## VO

See `script.txt`.

## Render

```bash
cd projects/interview-shorts/shorts/01-response-time
../../../../.venv/bin/python -m manim -pql scenes/response_time.py ResponseTimeBreakdown
# final IG:
../../../../.venv/bin/python -m manim -pqh scenes/response_time.py ResponseTimeBreakdown
```
