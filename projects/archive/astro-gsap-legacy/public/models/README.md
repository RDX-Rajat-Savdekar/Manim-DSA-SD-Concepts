# 3D models (not in git)

Originals → `public/models/_src/` · web builds → `public/models/` · studio HDRI → `public/hdri/`  
Attribution → [`ATTRIBUTION.md`](./ATTRIBUTION.md)

## Active garage models (v3)

| File | Route | Role |
|------|--------|------|
| `f1-amr23-parts.glb` | `/f1` Garage3D | Multi-mesh F1; wheel spin + airflow |
| `iron-man-rigged.glb` | `/iron-man` Garage3D | Mixamo-rigged Mark 85 |
| `mixamo-anims.glb` | `/iron-man` (anim pack) | Mixamo clips retargeted at runtime |
| `studio_small_09_1k.hdr` | garage env | Reflections only (CC0 Poly Haven) |

Mixamo download steps: [`_src/mixamo/README.md`](./_src/mixamo/README.md)

## Restore from Downloads

```bash
mkdir -p public/models/_src

# Iron Man Mixamo rig (preferred for /iron-man)
cp ~/Downloads/iron-man_mark_85__rigged.glb public/models/_src/iron-man-rigged.glb
npx --yes @gltf-transform/cli@4.1.1 optimize \
  public/models/_src/iron-man-rigged.glb \
  public/models/iron-man-rigged.glb \
  --compress meshopt --meshopt-level medium \
  --simplify false \
  --texture-compress webp --texture-size 2048 \
  --join false --flatten false

# F1 multi-mesh (if missing) — GetGLB Formula 1 Car / dark_igorek
# Or copy a known-good local file to public/models/f1-amr23-parts.glb

# Legacy backups (archive / sequences)
cp ~/Downloads/iron_man_mark_85.glb           public/models/_src/iron-man.glb
cp ~/Downloads/aston_martin_f1_amr23_2023.glb public/models/_src/f1-amr23.glb
cp ~/Downloads/f1_mercedes_w13_concept.glb    public/models/_src/f1-w13.glb
npm run optimize:models   # textured HQ path for iron-man / f1-amr23 / f1-w13
```

Audit after copy:

```bash
npm run audit:glb -- public/models/iron-man-rigged.glb
npm run audit:glb -- public/models/f1-amr23-parts.glb
```

## Typical sizes

| File | ~Size | Notes |
|------|-------|-------|
| `iron-man-rigged.glb` | ~11 MB | 66 bones, 10 skinned; no simplify |
| `f1-amr23-parts.glb` | ~24 MB | 16 meshes; axle wheels Object_10/27 |
| `iron-man.glb` | ~25 MB | Legacy named materials |
| `f1-amr23.glb` | ~8 MB | Single mesh (no wheel spin) |
| `f1-w13.glb` | ~5 MB | Named hubs (partial) |
| `studio_small_09_1k.hdr` | ~1.5 MB | Env map |

## Do not

- `--join true` / aggressive simplify on skinned Mixamo files (breaks weights).
- Commit GLBs (gitignored). Commit docs + code only.
