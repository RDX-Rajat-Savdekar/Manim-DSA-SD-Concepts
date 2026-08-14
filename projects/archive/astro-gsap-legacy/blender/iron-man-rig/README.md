# Iron Man · Blender mixamo lab

Fix the suit in Blender, then export a GLB that already has good clips.  
The broken web retarget was a symptom — Sketchfab renamed Mixamo bones (`mixamorigHips_01`) and JS can’t safely paste Y-Bot rotations onto that rest pose.

## Open this project

```bash
# from repo root (assets already copied once)
open -a Blender blender/iron-man-rig
# or File → Open later after you save iron-man-rig.blend here
```

Assets in `assets/`:

| File | What it is |
|------|------------|
| `iron-man-rigged.glb` | Mark 85 mesh + Mixamo-style armature (broken names) |
| `Flying.fbx` / `Falling.fbx` / `Thoughtful Head Shake.fbx` | Your Mixamo downloads (Without Skin) |
| `Xbot.glb` | Reference Mixamo body + idle/agree clips |

After you finish, export to `exports/iron-man-rigged.glb` and copy over:

```bash
cp blender/iron-man-rig/exports/iron-man-rigged.glb public/models/iron-man-rigged.glb
```

Then the site can play **embedded** clips — no JS retarget.

---

## 30-minute learning path (do this once)

You only need these Blender ideas:

1. **Object mode** — move whole models  
2. **Edit mode** (armature selected) — bone shapes / names  
3. **Pose mode** — animate bones  
4. **Action / NLA** — named clips (`idle`, `thrust`, `look`, `repulse`)  
5. **Export glTF** — what the website loads  

Skip weight painting for now. This suit is already skinned.

### Quick tour (5 min)

1. Open Blender → delete the default cube.  
2. `File → Import → glTF 2.0` → `assets/iron-man-rigged.glb`.  
3. Click the armature (often named `Armature` / `_rootJoint`).  
4. Top-left mode menu: **Pose Mode**. Press `A` (select all bones), `G` then `Z` — if the mesh follows, skinning is fine. `Esc` to cancel.  
5. `Alt+G` / `Alt+R` / `Alt+S` → clear pose (back to rest).  

That rest pose is the truth. Mixamo clips must land on **this** rest pose, not Y-Bot’s.

---

## The actual fix (recommended workflow)

### A — Rename bones to standard Mixamo (one-time)

Sketchfab used names like `mixamorigHips_01`. Mixamo FBX uses `mixamorigHips`.  
Rename once, then FBX actions stick.

1. Select the Iron Man **armature**.  
2. Switch to **Scripting** workspace.  
3. `Open` → `scripts/01_rename_mixamo_bones.py` → **Run Script**.  
4. Check the system console / Info: should list renames.  
5. In Pose mode, bones should now read `mixamorigHips`, `mixamorigSpine`, …

### B — Bring in a Mixamo animation

1. `File → Import → FBX` → e.g. `assets/Flying.fbx`  
   - Important import options:  
     - **Automatic Bone Orientation**: off (try off first)  
     - **Ignore Leaf Bones**: on  
     - Scale: leave default  
2. You’ll get a second armature (Y-Bot skeleton, no mesh if Without Skin).  
3. Select **Iron Man armature** → go to **Dope Sheet → Action Editor**.  
4. Open the dropdown of actions — Mixamo often names it `mixamo.com`.  
5. If the action is on the FBX armature only:  
   - Select FBX armature → Action Editor → rename action to `thrust` (for Flying).  
   - Select Iron Man armature → Action Editor → pick that same `thrust` action.  

Because bone names now match, the action should drive Mark 85.

6. Scrub the timeline. Legs should stay under the body.  
7. If the whole character is rotated 90°: select Iron Man armature in Object mode, `R X 90` or `R Z 180` until upright, then `Ctrl+A → Apply Rotation`.

### C — Save clean actions

For each clip you care about:

| Mixamo file | Action name (exact) |
|-------------|---------------------|
| Idle (download if needed) | `idle` |
| Flying.fbx | `thrust` |
| Thoughtful Head Shake.fbx | `look` |
| Pointing.fbx (optional) | `repulse` |
| Falling.fbx | `falling` |

In Action Editor: rename, then **Push Down** to NLA (keeps them from overwriting each other).

### D — Export for the website

1. Select Iron Man **mesh(es) + armature** only (hide/delete the FBX armature).  
2. Run `scripts/02_export_web_glb.py`  
   **or** manual: `File → Export → glTF 2.0`  
   - Format: **glTF Binary (.glb)**  
   - Include: Selected  
   - Animation: **Active** / bake all NLA strips  
   - Geometry: apply modifiers  
   - Transform: +Y up  
3. Save to `exports/iron-man-rigged.glb`  
4. Copy into `public/models/` (command above).

Hard-refresh `/iron-man`. Garage should use embedded clips.

---

## If the action doesn’t stick after rename

Bone names still differ (colons, etc.). Run `scripts/01_rename_mixamo_bones.py` again and read the printed “unmatched” list.

Fallback (manual, still educational):

1. Pose Mode on Iron Man.  
2. Select a bone → Bone Constraints → **Copy Rotation** → target = FBX bone.  
3. Do hips + spine + arms + legs (tedious — rename is better).  
4. `Pose → Animation → Bake Action` (visual keying, clear constraints).

---

## Optional free add-on

**Auto-Rig Pro** (paid) or free **“Animation Retargeting”** / **Rokoko Studio** Blender plugin — useful later.  
You do **not** need them for this Mixamo-named suit once bones match.

---

## What to practice next (order)

1. Pose mode + clear transforms  
2. Action Editor (one clip)  
3. NLA strips (several clips)  
4. Export GLB and prove it on `/debug/iron-man-rig` or `/iron-man`  
5. Later: weight paint, IK, custom controls  

---

## Website side after a good export

Once `iron-man-rigged.glb` contains clips named `idle` / `look` / `thrust` / `repulse`, we can stop loading `mixamo-anims.glb` for retarget. Tell the agent: “Iron Man GLB has baked Mixamo clips — use embedded animations only.”
