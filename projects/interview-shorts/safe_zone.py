"""Instagram Reels / YouTube Shorts UI safe zone for 9:16 Manim frames.

Platform chrome eats the edges. Keep all readable content inside these margins.
See docs/video-production/MANIM-AGENT-LESSONS.md
"""

from __future__ import annotations

# Fractions of frame size to leave empty for UI
SAFE_TOP = 0.12  # status + "Reels" / Shorts header
SAFE_BOTTOM = 0.24  # caption, username, comment bar, audio pill
SAFE_LEFT = 0.06
SAFE_RIGHT = 0.18  # like / comment / share / save column

# Minimum Manim Text font_size for phone-arm readability (9×16 frame)
MIN_TITLE = 30
MIN_BODY = 20
MIN_TAG = 18  # brace / axis / line tags


def safe_bounds(
    frame_width: float = 9.0,
    frame_height: float = 16.0,
) -> tuple[float, float, float, float]:
    """Return (x_min, x_max, y_min, y_max) in Manim scene coords (origin center)."""
    x_min = -frame_width / 2 + frame_width * SAFE_LEFT
    x_max = frame_width / 2 - frame_width * SAFE_RIGHT
    y_max = frame_height / 2 - frame_height * SAFE_TOP
    y_min = -frame_height / 2 + frame_height * SAFE_BOTTOM
    return x_min, x_max, y_min, y_max


def safe_width(frame_width: float = 9.0) -> float:
    x_min, x_max, _, _ = safe_bounds(frame_width=frame_width)
    return x_max - x_min


def safe_height(frame_height: float = 16.0) -> float:
    _, _, y_min, y_max = safe_bounds(frame_height=frame_height)
    return y_max - y_min
