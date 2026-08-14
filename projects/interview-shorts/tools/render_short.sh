#!/usr/bin/env bash
# Canonical Manim render for interview shorts (9:16).
# Usage (from a short folder, e.g. shorts/01-response-time):
#   ../../tools/render_short.sh scenes/response_time.py ResponseTimeBreakdown
#   ../../tools/render_short.sh scenes/response_time.py ResponseTimeBreakdown preview
#   ../../tools/render_short.sh scenes/response_time.py ResponseTimeBreakdown final

set -euo pipefail

SCENE_FILE="${1:?scene file required}"
SCENE_CLASS="${2:?scene class required}"
MODE="${3:-preview}"

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PY="${REPO_ROOT}/.venv/bin/python"

if [[ ! -x "$PY" ]]; then
  echo "Missing venv python: $PY" >&2
  exit 1
fi

case "$MODE" in
  preview)
    exec "$PY" -m manim -ql --resolution 480,854 --fps 15 --disable_caching \
      "$SCENE_FILE" "$SCENE_CLASS"
    ;;
  final|4k)
    # Lock 30fps — do not use bare -qh (can land in 60fps / wrong folder)
    exec "$PY" -m manim -qh --resolution 2160,3840 --fps 30 --disable_caching \
      "$SCENE_FILE" "$SCENE_CLASS"
    ;;
  ig|1080)
    exec "$PY" -m manim -qh --resolution 1080,1920 --fps 30 --disable_caching \
      "$SCENE_FILE" "$SCENE_CLASS"
    ;;
  *)
    echo "Unknown mode: $MODE (preview|final|ig)" >&2
    exit 1
    ;;
esac
