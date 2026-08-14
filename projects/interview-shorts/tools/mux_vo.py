#!/usr/bin/env python3
"""Mux Manim MP4 + VO wav → final (freeze-pad video if VO is longer)."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def ffprobe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        text=True,
    )
    return float(json.loads(out)["format"]["duration"])


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--video", type=Path, required=True)
    p.add_argument("--audio", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()

    if not args.video.is_file() or not args.audio.is_file():
        print("Missing video or audio", file=sys.stderr)
        raise SystemExit(1)

    v = ffprobe_duration(args.video)
    a = ffprobe_duration(args.audio)
    pad = max(0.0, a - v + 0.05)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    print(f"video={v:.2f}s audio={a:.2f}s freeze_pad={pad:.2f}s")

    if pad > 0.01:
        filt = f"[0:v]tpad=stop_mode=clone:stop_duration={pad:.3f}[v]"
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(args.video),
            "-i",
            str(args.audio),
            "-filter_complex",
            filt,
            "-map",
            "[v]",
            "-map",
            "1:a",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(args.out),
        ]
    else:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(args.video),
            "-i",
            str(args.audio),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(args.out),
        ]

    subprocess.check_call(cmd)
    print(f"wrote {args.out} ({ffprobe_duration(args.out):.2f}s)")


if __name__ == "__main__":
    main()
