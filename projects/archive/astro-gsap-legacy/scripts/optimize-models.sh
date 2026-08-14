#!/usr/bin/env bash
# High-quality web GLBs from public/models/_src/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI=(npx --yes @gltf-transform/cli@4.1.1)
mkdir -p "$ROOT/public/models/_src"

backup_if_needed() {
  local name="$1"
  local src="$ROOT/public/models/${name}.glb"
  local bak="$ROOT/public/models/_src/${name}.glb"
  if [[ -f "$src" && ! -f "$bak" ]]; then
    cp "$src" "$bak"
    echo "backed up $name → _src/"
  fi
}

for n in iron-man-body iron-man f1-amr23 f1-w13; do backup_if_needed "$n"; done

# Body is raw STL: lighter simplify — NO meshopt/quantize (breaks materials / can vanish in WebGL)
echo "→ iron-man-body (simplify only, ~5%)"
"${CLI[@]}" weld "$ROOT/public/models/_src/iron-man-body.glb" /tmp/body-weld.glb
"${CLI[@]}" simplify /tmp/body-weld.glb /tmp/body-simp.glb --ratio 0.05 --error 0.015
"${CLI[@]}" optimize /tmp/body-simp.glb "$ROOT/public/models/iron-man-body.glb" \
  --compress false --simplify false --texture-compress false --join true --flatten true --palette false
ls -lh "$ROOT/public/models/iron-man-body.glb"

optimize_textured() {
  local name="$1"
  echo "→ $name (92% keep, 4K webp, meshopt medium)"
  "${CLI[@]}" optimize \
    "$ROOT/public/models/_src/${name}.glb" \
    "$ROOT/public/models/${name}.glb" \
    --compress meshopt \
    --meshopt-level medium \
    --simplify-ratio 0.92 \
    --simplify-error 0.0002 \
    --texture-compress webp \
    --texture-size 4096
  ls -lh "$ROOT/public/models/${name}.glb"
}

optimize_textured iron-man
optimize_textured f1-amr23
optimize_textured f1-w13
echo "Done."
