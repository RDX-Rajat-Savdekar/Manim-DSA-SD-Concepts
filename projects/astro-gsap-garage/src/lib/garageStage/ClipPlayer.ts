/**
 * AnimationMixer wrapper for Mixamo clips retargeted onto the suit rig.
 */
import * as THREE from "three";

export interface ClipPlayOptions {
  /** Play the clip backward (e.g. standing → sit-down). */
  reverse?: boolean;
}

export interface ClipPlayer {
  play(name: string, fade?: number, opts?: ClipPlayOptions): void;
  update(dt: number): void;
  has(name: string): boolean;
  names(): string[];
  /** 0–1 progress through the active clip loop. */
  progress(): number;
  /** Canonical name of the active clip. */
  currentName(): string;
  /** True when the active action is playing in reverse. */
  isReversed(): boolean;
  get size(): number;
  dispose(): void;
}

export function createClipPlayer(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[],
): ClipPlayer {
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map<string, THREE.AnimationAction>();

  for (const clip of clips) {
    const key = String(clip.name || "").toLowerCase();
    if (!key || actions.has(key)) continue;
    const action = mixer.clipAction(clip);
    action.enabled = true;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    actions.set(key, action);
  }

  let current: THREE.AnimationAction | null = null;
  let currentKey = "";
  let reversed = false;

  function resolve(name: string): { action: THREE.AnimationAction; key: string } | null {
    const key = String(name || "standing").toLowerCase();
    const mapped = key === "look" ? "idle" : key;
    const action =
      actions.get(mapped) ||
      actions.get("standing") ||
      actions.get("idle") ||
      null;
    if (!action) return null;
    const resolved =
      actions.has(mapped) ? mapped : actions.has("standing") ? "standing" : "idle";
    return { action, key: resolved };
  }

  function play(name: string, fade = 0.4, opts?: ClipPlayOptions) {
    const next = resolve(name);
    if (!next) return;
    const wantReverse = Boolean(opts?.reverse);
    if (next.action === current && reversed === wantReverse) return;

    next.action.reset();
    next.action.setEffectiveWeight(1);
    next.action.timeScale = wantReverse ? -1 : 1;

    if (wantReverse) {
      // Sit-down from stand: play Standing backward once, hold the end pose
      const dur = next.action.getClip().duration || 1;
      next.action.time = Math.max(0, dur - 0.001);
      next.action.setLoop(THREE.LoopOnce, 1);
      next.action.clampWhenFinished = true;
    } else {
      next.action.setLoop(THREE.LoopRepeat, Infinity);
      next.action.clampWhenFinished = false;
    }

    next.action.play();

    if (current && current !== next.action) {
      current.crossFadeTo(next.action, fade, false);
    } else if (!current) {
      next.action.fadeIn(fade);
    } else {
      // Same clip, flipped direction — hard cut after reset
      next.action.fadeIn(Math.min(0.2, fade));
    }

    current = next.action;
    currentKey = next.key;
    reversed = wantReverse;
  }

  return {
    play,
    update(dt: number) {
      mixer.update(dt);
    },
    has(name: string) {
      return actions.has(String(name || "").toLowerCase());
    },
    names() {
      return Array.from(actions.keys());
    },
    progress() {
      if (!current) return 0;
      const clip = current.getClip();
      const dur = clip.duration || 1;
      const t = ((current.time % dur) + dur) % dur;
      return THREE.MathUtils.clamp(t / dur, 0, 1);
    },
    currentName() {
      return currentKey;
    },
    isReversed() {
      return reversed;
    },
    get size() {
      return actions.size;
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      actions.clear();
      current = null;
      currentKey = "";
      reversed = false;
    },
  };
}
