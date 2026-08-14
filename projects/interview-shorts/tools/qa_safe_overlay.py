#!/usr/bin/env python3
"""Draw Reels/Shorts safe-zone overlay on QA frames.

Usage:
  .venv/bin/python projects/interview-shorts/tools/qa_safe_overlay.py path/to/frame.png
  # writes path/to/frame_overlay.png
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

# Keep in sync with safe_zone.py
SAFE_TOP = 0.12
SAFE_BOTTOM = 0.24
SAFE_LEFT = 0.06
SAFE_RIGHT = 0.18


def overlay(src: Path, dst: Path | None = None) -> Path:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    mask = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(mask)
    red = (220, 40, 40, 90)
    d.rectangle([0, 0, w, int(h * SAFE_TOP)], fill=red)
    d.rectangle([0, int(h * (1 - SAFE_BOTTOM)), w, h], fill=red)
    d.rectangle([0, 0, int(w * SAFE_LEFT), h], fill=red)
    d.rectangle([int(w * (1 - SAFE_RIGHT)), 0, w, h], fill=red)
    d.rectangle(
        [
            int(w * SAFE_LEFT),
            int(h * SAFE_TOP),
            int(w * (1 - SAFE_RIGHT)) - 1,
            int(h * (1 - SAFE_BOTTOM)) - 1,
        ],
        outline=(40, 200, 80, 220),
        width=max(2, w // 400),
    )
    out = Image.alpha_composite(im, mask).convert("RGB")
    if dst is None:
        dst = src.with_name(src.stem + "_overlay.png")
    out.save(dst)
    return dst


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("images", nargs="+", type=Path)
    args = p.parse_args()
    for img in args.images:
        if not img.is_file():
            print(f"missing: {img}", file=sys.stderr)
            raise SystemExit(1)
        written = overlay(img)
        print(written)


if __name__ == "__main__":
    main()
