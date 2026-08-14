"""IG short: mean vs median vs percentiles on response-time bars.

Timed to output/vo_puck.wav (~27s).
Layout stays inside Reels/Shorts safe zone (see safe_zone.py).
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from manim import *

config.frame_width = 9
config.frame_height = 16

SHORT_ROOT = Path(__file__).resolve().parents[1]
IS_ROOT = Path(__file__).resolve().parents[3]  # projects/interview-shorts
sys.path.insert(0, str(SHORT_ROOT))
sys.path.insert(0, str(IS_ROOT))

from safe_zone import safe_bounds
from theme import (
    ACCENT,
    BG,
    BAR,
    FONT,
    INK,
    MEAN,
    MEDIAN,
    MUTED,
    OUTLIER,
    P95,
    P99,
    PUNCHLINE,
    TITLE,
)

OUTLIER_IDX = (3, 11, 18, 22, 27, 34, 39, 44)


def _label(text: str, size: float = 28, color: str = INK) -> Text:
    return Text(text, font=FONT, font_size=size, color=color)


def _make_heights(n: int = 48) -> np.ndarray:
    rng = np.random.default_rng(7)
    h = rng.uniform(0.35, 0.62, size=n)
    for i in OUTLIER_IDX:
        if i == 22:
            h[i] = 1.75
        else:
            h[i] = rng.uniform(0.95, 1.55)
    return h


class PercentilesBreakdown(Scene):
    def construct(self) -> None:
        self.camera.background_color = BG

        sx_min, sx_max, sy_min, sy_max = safe_bounds()

        heights = _make_heights()
        n = len(heights)
        median_v = float(np.median(heights))
        mean_v = float(np.mean(heights))
        p95_v = float(np.percentile(heights, 95))
        p99_v = float(np.percentile(heights, 99))

        # Chart inside safe zone; leave RIGHT strip for line tags (still left of IG UI)
        tag_gutter = 1.15
        chart_left = sx_min + 0.55
        chart_right = sx_max - tag_gutter
        chart_bottom, chart_top = -1.5, 2.85
        max_h = 1.85
        bar_gap = 0.04
        usable = chart_right - chart_left
        bar_w = (usable - bar_gap * (n - 1)) / n

        title = _label(TITLE, size=30, color=INK)
        title.move_to([0, sy_max - 0.35, 0])

        y_lab = _label("Response time", size=16, color=MUTED)
        y_lab.rotate(PI / 2)
        y_lab.move_to([sx_min + 0.22, (chart_bottom + chart_top) / 2, 0])

        x_lab = _label("Requests", size=16, color=MUTED)
        x_lab.move_to([(chart_left + chart_right) / 2, chart_bottom - 0.45, 0])

        x_axis = Line(
            [chart_left, chart_bottom, 0],
            [chart_right, chart_bottom, 0],
            color=MUTED,
            stroke_width=2,
        )
        y_axis = Line(
            [chart_left, chart_bottom, 0],
            [chart_left, chart_top, 0],
            color=MUTED,
            stroke_width=2,
        )

        bars = VGroup()
        for i, h in enumerate(heights):
            x0 = chart_left + i * (bar_w + bar_gap)
            height = (h / max_h) * (chart_top - chart_bottom - 0.15)
            rect = Rectangle(
                width=bar_w,
                height=max(height, 0.05),
                fill_color=BAR,
                fill_opacity=0.85,
                stroke_width=0,
            )
            rect.move_to(
                [x0 + bar_w / 2, chart_bottom + max(height, 0.05) / 2, 0],
                aligned_edge=ORIGIN,
            )
            bars.add(rect)

        outlier_bars = VGroup(*[bars[i] for i in OUTLIER_IDX])
        normal_bars = VGroup(
            *[bars[i] for i in range(n) if i not in OUTLIER_IDX]
        )

        def h_line(value: float, color: str, dashed: bool = True) -> Line:
            y = chart_bottom + (value / max_h) * (chart_top - chart_bottom - 0.15)
            line = DashedLine(
                [chart_left, y, 0],
                [chart_right, y, 0],
                color=color,
                dash_length=0.12,
                stroke_width=3,
            ) if dashed else Line(
                [chart_left, y, 0],
                [chart_right, y, 0],
                color=color,
                stroke_width=3.5,
            )
            return line

        def line_tag(text: str, value: float, color: str) -> Text:
            # Tags sit in the safe right gutter — never under Reels engagement icons
            y = chart_bottom + (value / max_h) * (chart_top - chart_bottom - 0.15)
            lab = _label(text, size=16, color=color)
            lab.next_to(
                Dot([chart_right, y, 0], radius=0),
                RIGHT,
                buff=0.12,
            )
            if lab.get_right()[0] > sx_max - 0.05:
                lab.shift(LEFT * (lab.get_right()[0] - (sx_max - 0.05)))
            return lab

        median_line = h_line(median_v, MEDIAN, dashed=True)
        mean_line = h_line(mean_v, MEAN, dashed=False)
        p95_line = h_line(p95_v, P95, dashed=True)
        p99_line = h_line(p99_v, P99, dashed=True)

        median_tag = line_tag("Median", median_v, MEDIAN)
        mean_tag = line_tag("Mean", mean_v, MEAN)
        p95_tag = line_tag("p95", p95_v, P95)
        p99_tag = line_tag("p99", p99_v, P99)

        punch = _label(PUNCHLINE, size=24, color=ACCENT)
        punch.move_to([0, sy_min + 0.55, 0])

        # --- Timed to ~27s VO ---
        self.play(FadeIn(title, shift=DOWN * 0.15), run_time=0.5)
        self.wait(0.4)
        self.play(Create(x_axis), Create(y_axis), FadeIn(x_lab), FadeIn(y_lab), run_time=0.55)
        self.wait(0.35)

        # bars = distribution ("a few are slow")
        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.02),
            run_time=2.4,
        )
        self.wait(3.2)

        # median
        self.play(Create(median_line), FadeIn(median_tag), run_time=0.6)
        self.wait(3.6)

        # "outliers" → highlight spikes, then mean line
        self.play(
            normal_bars.animate.set_fill(BAR, opacity=0.28),
            outlier_bars.animate.set_fill(OUTLIER, opacity=1.0),
            run_time=0.55,
        )
        self.play(
            LaggedStart(
                *[Indicate(b, color=OUTLIER, scale_factor=1.12) for b in outlier_bars],
                lag_ratio=0.06,
            ),
            run_time=0.9,
        )
        self.play(Create(mean_line), FadeIn(mean_tag), run_time=0.55)
        self.wait(2.6)

        # p95 / p99
        self.play(Create(p95_line), FadeIn(p95_tag), run_time=0.5)
        self.wait(1.3)
        self.play(Create(p99_line), FadeIn(p99_tag), run_time=0.5)
        self.wait(2.3)

        # punchline
        self.play(FadeIn(punch, shift=UP * 0.12), run_time=0.5)
        self.wait(4.8)
