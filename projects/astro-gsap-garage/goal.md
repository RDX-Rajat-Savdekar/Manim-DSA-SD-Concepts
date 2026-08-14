# Specification: Gamified Astro × GSAP × Three.js Product Stage

This document outlines the goal and technical specifications for building a high-end, responsive 3D interactive showcase for the **Iron Man Mark 85** suit and the **Aston Martin AMR23 F1** car, behaving like game character selection or tuning screens.

---

## 1. Core Architecture

The project is built on **Astro** for structure, **GSAP (ScrollTrigger)** for scroll-scrubbed timing, and **Three.js (WebGL)** for real-time 3D rendering.

### The Pinned 3D Viewport
- As the user scrolls, a full-screen `canvas` is pinned in the viewport.
- The scrollbar progress is converted into a beat index (0 to 8).
- Each beat defines:
  - Authored camera look `[azimuth, elevation, zoom, targetX, targetY, targetZ, fov]`.
  - Specific procedural animation states and visual effects (VFX).
- Interactive navigation HUD links (the "strip") and projected HTML/CSS annotations (hotspots) allow the user to jump directly to specific camera positions.

---

## 2. Iron Man Mark 85: Poses & Visual Effects

The Iron Man showcase uses `iron-man-rigged.glb` (66 Mixamo bones) to trigger gamified poses and high-tech overlay graphics:

### Default / Hero Beat (Beat 0)
- **Pose:** Standard standing A-pose / hovering idle.
- **VFX:** Subtle body floating (sine wave bobbing on Y axis), pulsing eyes and chest reactor.

### Arc Reactor (Beat 1)
- **Pose:** Spine tilts back slightly (chest puffing out).
- **VFX:** Blindly bright pulse on Arc Reactor material, circular glowing shockwave ring expanding outwards from chest.

### Helmet HUD (Beat 2)
- **Pose:** Head rotates slowly side-to-side (scanning surroundings) and looks back at camera.
- **VFX:** Glowing neon HUD interface (concentric circles, crosshairs, and data ticks) rotating in front of the visor.

### Unibeam (Beat 3)
- **Pose:** Combat stance, shoulders back.
- **VFX:** Blinding volumetric laser cylinder firing forward from chest with electrical particles.

### Repulsors (Beat 4)
- **Pose:** Left and right arms raised forward, palms flexed back towards camera.
- **VFX:** Energy charging glow in the palm, followed by continuous laser beams firing out of palms.

### Flight & Back Boosters (Beat 5 & 7)
- **Pose:** Body tilts forward, knees bend back slightly.
- **VFX:** Dual flame/plasma particle thrusters emitting from feet and back booster ports, pointing a spotlight downward to cast lighting onto the ground.

### Shoulder Pods (Beat 6)
- **Pose:** Defensive brace.
- **VFX:** Targeting lock-on HUD crosshairs projecting in 3D space near both shoulders.

### Nanotech (Beat 8)
- **Pose:** Neutral/standing.
- **VFX:** Glowing digital matrix scanning sweep flowing across the entire mesh using emissive materials.

---

## 3. F1 AMR23: Wind Tunnel & Telemetry Effects

The F1 showcase uses `f1-amr23-parts.glb` to simulate wind tunnel testing and diagnostics:

### Front Wing (Beat 1)
- **VFX:** Glowing aerodynamic stream lines (CFD ribbons) flowing over the front wing, under-nose neon green light.

### Nose (Beat 2)
- **VFX:** Laser-sweep scan bar (neon plane/line) running along the front nose of the car.

### Sidepods (Beat 3)
- **VFX:** Heat distortion haze (pulsating sparks/smoke) emitting out of the sidepod radiators.

### Halo (Beat 4)
- **VFX:** Holographic steering wheel dashboard projecting above the cockpit, displaying rev indicators.

### Floor (Beat 5)
- **VFX:** Neon underglow lights projecting onto the floor beneath the chassis.

### Rear Wing (Beat 6)
- **VFX:** DRS wing flap opens, and aerodynamic drag lines shift color from green to high-speed red.

### Power Unit (Beat 7)
- **VFX:** Engine block highlights, crackling neon electrical arcs (lightning lines) around the hybrid engine bay.

### Tyres (Beat 8)
- **VFX:** Tyres spin up at high speed, emitting tyre smoke particles, and tyre thermo indicators color-shift wheels to hot red/yellow.
