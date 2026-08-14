"""IG short: response time = network + queueing + service + network.

Story: show two network hops first (compressed middle), expand the gap,
then reveal queueing delay and service time one by one.

Layout stays inside Reels/Shorts safe zone (see safe_zone.py).
"""

from __future__ import annotations

import sys
from pathlib import Path

from manim import *

# Instagram vertical (must set before Scene runs; -ql still overrides pixels)
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
    CLIENT,
    INK,
    PROCESS,
    PUNCHLINE,
    QUEUE,
    SERVICE,
)

ASSETS = SHORT_ROOT / "assets"


def _label(text: str, size: float = 28, color: str = INK) -> Mobject:
    return Text(text, font="DejaVu Sans", font_size=size, color=color)


def _icon(name: str, color: str, height: float = 0.55) -> SVGMobject:
    icon = SVGMobject(str(ASSETS / name))
    icon.set_color(color)
    icon.set_height(height)
    return icon


def _lane_tag(icon_name: str, text: str, color: str) -> VGroup:
    return VGroup(
        _icon(icon_name, color, height=0.62),
        _label(text, size=24, color=color),
    ).arrange(RIGHT, buff=0.2)


def _brace_label(
    x0: float,
    x1: float,
    y: float,
    text: str,
    color: str,
    *,
    font_size: float = 22,
    brace_buff: float = 0.06,
    label_buff: float = 0.08,
    x_max: float | None = None,
) -> VGroup:
    """Underline bracket + label. Label keeps natural width (never fitted to span)."""
    left, right = sorted((x0, x1))
    tick = 0.14
    y0 = y - brace_buff
    bracket = VGroup(
        Line([left, y0, 0], [left, y0 - tick, 0], color=color, stroke_width=2.5),
        Line([left, y0 - tick, 0], [right, y0 - tick, 0], color=color, stroke_width=2.5),
        Line([right, y0 - tick, 0], [right, y0, 0], color=color, stroke_width=2.5),
    )
    lab = Text(text, font="DejaVu Sans", font_size=font_size, color=color)
    lab.next_to(bracket, DOWN, buff=label_buff)
    if x_max is not None and lab.get_right()[0] > x_max:
        lab.shift(LEFT * (lab.get_right()[0] - x_max))
    return VGroup(bracket, lab)


class ResponseTimeBreakdown(Scene):
    def construct(self) -> None:
        self.camera.background_color = BG

        sx_min, sx_max, sy_min, sy_max = safe_bounds()
        # Inner padding so arrow tips / labels don't kiss the gutter
        lane_left = sx_min + 0.15
        lane_right = sx_max - 0.15

        client_y = 2.05
        service_y = -0.35

        # Compressed middle first; expand later — all within safe x
        x_leave = ValueTracker(lane_left + 0.35)
        x_arrive = ValueTracker(-0.55)
        x_depart = ValueTracker(0.55)
        x_recv = ValueTracker(lane_right - 0.35)

        title = _label("Why is my request slow?", size=34, color=INK)
        title.move_to([0, sy_max - 0.35, 0])

        client_line = DashedLine(
            [lane_left, client_y, 0],
            [lane_right, client_y, 0],
            color=CLIENT,
            dash_length=0.15,
            stroke_opacity=0.55,
        )
        service_line = DashedLine(
            [lane_left, service_y, 0],
            [lane_right, service_y, 0],
            color=SERVICE,
            dash_length=0.15,
            stroke_opacity=0.55,
        )

        client_tag = _lane_tag("client.svg", "Client", CLIENT)
        client_tag.move_to([lane_left + 1.2, client_y + 0.58, 0])

        service_tag = _lane_tag("service.svg", "Service", SERVICE)
        service_tag.move_to([lane_left + 1.3, service_y + 0.58, 0])

        def make_request() -> Arrow:
            return Arrow(
                start=np.array([x_leave.get_value(), client_y, 0]),
                end=np.array([x_arrive.get_value(), service_y, 0]),
                buff=0.05,
                color=CLIENT,
                stroke_width=4,
                max_tip_length_to_length_ratio=0.12,
            )

        def make_response() -> Arrow:
            return Arrow(
                start=np.array([x_depart.get_value(), service_y, 0]),
                end=np.array([x_recv.get_value(), client_y, 0]),
                buff=0.05,
                color=SERVICE,
                stroke_width=4,
                max_tip_length_to_length_ratio=0.12,
            )

        def make_edge_words() -> VGroup:
            # Both labels sit INSIDE the V (left of midpoints) — never into right UI
            req_mid_x = (x_leave.get_value() + x_arrive.get_value()) / 2
            resp_mid_x = (x_depart.get_value() + x_recv.get_value()) / 2
            mid_y = (client_y + service_y) / 2

            req_word = _label("Request", size=20, color=CLIENT)
            resp_word = _label("Response", size=20, color=SERVICE)
            req_word.move_to([req_mid_x - 0.85, mid_y + 0.15, 0])
            resp_word.move_to([resp_mid_x - 0.95, mid_y + 0.15, 0])
            if resp_word.get_right()[0] > sx_max - 0.05:
                resp_word.shift(LEFT * (resp_word.get_right()[0] - (sx_max - 0.05)))
            return VGroup(req_word, resp_word)

        req = always_redraw(make_request)
        resp = always_redraw(make_response)
        edge_words = always_redraw(make_edge_words)

        # Beat 0 — title + lanes
        self.play(FadeIn(title, shift=DOWN * 0.2), run_time=0.5)
        self.play(
            Create(client_line),
            Create(service_line),
            FadeIn(client_tag),
            FadeIn(service_tag),
            run_time=0.6,
        )
        self.wait(1.0)

        # Beat 1 — request + response (compressed)
        self.play(Create(req), run_time=0.5)
        self.play(Create(resp), FadeIn(edge_words), run_time=0.55)
        self.wait(1.4)

        # Beat 2 — network latency tight under the hops
        brace_y = service_y - 0.08
        net_left = _brace_label(
            x_leave.get_value(),
            x_arrive.get_value(),
            brace_y,
            "Network latency",
            ACCENT,
            font_size=16,
            brace_buff=0.04,
            label_buff=0.04,
            x_max=sx_max,
        )
        net_right = _brace_label(
            x_depart.get_value(),
            x_recv.get_value(),
            brace_y,
            "Network latency",
            ACCENT,
            font_size=16,
            brace_buff=0.04,
            label_buff=0.04,
            x_max=sx_max,
        )
        self.play(FadeIn(net_left), FadeIn(net_right), run_time=0.5)
        self.wait(3.2)

        # Beat 3 — expand middle (edges push apart, stay in safe x)
        self.play(FadeOut(net_left), FadeOut(net_right), run_time=0.25)
        self.play(
            x_leave.animate.set_value(lane_left + 0.1),
            x_arrive.animate.set_value(-1.35),
            x_depart.animate.set_value(1.15),
            x_recv.animate.set_value(lane_right - 0.1),
            run_time=3.0,
            rate_func=rate_functions.ease_out_cubic,
        )
        self.wait(0.8)

        # Network labels stay near the lane (under queue/service braces)
        net_brace_y = service_y - 0.68
        net_left_2 = _brace_label(
            x_leave.get_value(),
            x_arrive.get_value(),
            net_brace_y,
            "Network latency",
            ACCENT,
            font_size=18,
            brace_buff=0.04,
            label_buff=0.04,
            x_max=sx_max,
        )
        net_right_2 = _brace_label(
            x_depart.get_value(),
            x_recv.get_value(),
            net_brace_y,
            "Network latency",
            ACCENT,
            font_size=18,
            brace_buff=0.04,
            label_buff=0.04,
            x_max=sx_max,
        )
        self.play(FadeIn(net_left_2), FadeIn(net_right_2), run_time=0.4)

        # Beat 4 — queueing delay (brace sits between lane and network labels)
        q_start = x_arrive.get_value()
        q_end = -0.2
        queue_seg = Line(
            [q_start, service_y, 0],
            [q_end, service_y, 0],
            color=QUEUE,
            stroke_width=10,
        )
        # Label ABOVE the segment so it won't collide with Service time below
        queue_lab = _label("Queueing delay", size=16, color=QUEUE)
        queue_lab.next_to(queue_seg, UP, buff=0.12)
        if queue_lab.get_right()[0] > sx_max:
            queue_lab.shift(LEFT * (queue_lab.get_right()[0] - sx_max))
        self.play(Create(queue_seg), run_time=0.45)
        self.play(FadeIn(queue_lab), run_time=0.4)
        self.wait(3.0)

        # Beat 5 — more expand + processing / service time
        new_depart = min(1.55, lane_right - 1.15)
        new_recv = lane_right - 0.05
        self.play(
            x_depart.animate.set_value(new_depart),
            x_recv.animate.set_value(new_recv),
            net_right_2.animate.move_to(
                [(new_depart + new_recv) / 2, net_right_2.get_center()[1], 0]
            ),
            run_time=1.2,
            rate_func=rate_functions.ease_out_cubic,
        )

        p_start = q_end
        p_end = x_depart.get_value()
        process_box = RoundedRectangle(
            width=max(p_end - p_start, 0.45),
            height=0.7,
            corner_radius=0.08,
            color=PROCESS,
            fill_color=PROCESS,
            fill_opacity=0.22,
            stroke_width=3,
        )
        process_box.move_to([(p_start + p_end) / 2, service_y, 0])
        process_text = _label("Processing", size=18, color=PROCESS)
        process_text.move_to(process_box.get_center())

        service_brace = _brace_label(
            p_start,
            p_end,
            service_y - 0.08,
            "Service time",
            PROCESS,
            font_size=16,
            brace_buff=0.04,
            label_buff=0.04,
            x_max=sx_max,
        )
        self.play(FadeIn(process_box), FadeIn(process_text), run_time=0.5)
        self.play(FadeIn(service_brace), run_time=0.4)
        self.wait(3.2)

        # Beat 7 — full response time + punchline (above bottom UI)
        total_brace = _brace_label(
            x_leave.get_value(),
            x_recv.get_value(),
            service_y - 1.45,
            "Response time",
            INK,
            font_size=22,
            brace_buff=0.05,
            label_buff=0.05,
            x_max=sx_max,
        )
        punch = _label(PUNCHLINE, size=28, color=ACCENT)
        punch.move_to([0, sy_min + 0.55, 0])

        self.play(FadeIn(total_brace), run_time=0.55)
        self.play(FadeIn(punch, shift=UP * 0.15), run_time=0.45)
        self.wait(4.5)
