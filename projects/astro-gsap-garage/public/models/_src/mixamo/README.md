# Mixamo → Iron Man

## Active runtime

| File | Role |
|------|------|
| `iron-man-rigged.glb` | Textured Sketchfab Mixamo rig (from `_src/`) |
| `mixamo-anims.glb` | Clips from `skin_fbx/` (+ extras) |

## Story clips

standing, idle, fight, fireball, repulse, quadpunch, thrust, flipkick, butterflytwirl  
(plus unused pack: lowcrawl, falling; look dropped)

## Pack

```bash
npm run mixamo:character
# then restore textures:
npx --yes @gltf-transform/cli@4.1.1 optimize \
  public/models/_src/iron-man-rigged.glb \
  public/models/iron-man-rigged.glb \
  --compress meshopt --meshopt-level medium \
  --simplify false --texture-compress webp --texture-size 2048 \
  --join false --flatten false
```

Debug: `/debug/iron-man-anims` · Story: `/iron-man`
