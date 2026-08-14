# 3D models (not in git)

Originals → `public/models/_src/` · web builds → `public/models/` · studio HDRI → `public/hdri/`  
Attribution → [`ATTRIBUTION.md`](./ATTRIBUTION.md)

## Active garage models (Beat 10 finale)

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

# F1 multi-mesh — copy a known-good local file to public/models/f1-amr23-parts.glb
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
| `mixamo-anims.glb` | ~2 MB | Clip pack |
| `studio_small_09_1k.hdr` | ~1.5 MB | Env map |

## Do not

- `--join true` / aggressive simplify on skinned Mixamo files (breaks weights).
- Commit GLBs (gitignored). Commit docs + code only.
- Keep alternate car / legacy Iron Man GLBs in this folder — they were removed to keep the deploy lean.
