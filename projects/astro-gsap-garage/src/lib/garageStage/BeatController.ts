/**
 * BeatController — ScrollTrigger pin + scrub with look/explode/fx interpolation.
 */
import { gsap, ScrollTrigger } from "../gsap";
import type { Beat, Look, FxConfig, ScrubPayload } from "./types";

void ScrollTrigger;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpLook(a: Look, b: Look, t: number): Look {
  return {
    azimuth: lerp(a.azimuth, b.azimuth, t),
    elevation: lerp(a.elevation, b.elevation, t),
    zoom: lerp(a.zoom, b.zoom, t),
    tx: lerp(a.tx, b.tx, t),
    ty: lerp(a.ty, b.ty, t),
    tz: lerp(a.tz, b.tz, t),
    fov: lerp(a.fov, b.fov, t),
  };
}

/**
 * Blend FX across a beat segment.
 * Numbers ease smoothly. Discrete keys (clip, booleans, strings) stay on beat A
 * for the whole segment so animation/VFX don't jump ahead of the UI mid-scroll.
 */
export function lerpFx(a: FxConfig = {}, b: FxConfig = {}, t: number): FxConfig {
  const res: FxConfig = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const valA = a[k];
    const valB = b[k];
    if (typeof valA === "number" || typeof valB === "number") {
      res[k] = lerp((valA as number) ?? 0, (valB as number) ?? 0, t);
    } else {
      // Hold beat A's clip / flags until the next beat becomes active
      res[k] = valA !== undefined ? valA : valB;
    }
  }
  return res;
}

export interface BeatControllerOptions {
  trigger: HTMLElement;
  beats: Beat[];
  onScrub?: (payload: ScrubPayload) => void;
  onActiveBeat?: (beat: Beat) => void;
  onPinToggle?: (active: boolean) => void;
  /** Fired when a strip/hotspot jump starts — snap camera / UI to the target beat. */
  onJumpToBeat?: (beat: Beat) => void;
  pinStart?: string;
  endPerBeat?: number;
}

export interface BeatControllerApi {
  scrollToBeat(beatIndex: number): void;
  kill(): void;
  getProgress(): number;
}

export function createPinnedBeatController({
  trigger,
  beats,
  onScrub,
  onActiveBeat,
  onPinToggle,
  onJumpToBeat,
  pinStart = "top top+=72",
  endPerBeat = 75,
}: BeatControllerOptions): BeatControllerApi {
  if (!trigger || !beats?.length) {
    return { scrollToBeat() {}, kill() {}, getProgress: () => 0 };
  }

  let activeIndex = 0;
  /** While jumping via strip/hotspot, suppress intermediate onActiveBeat thrash. */
  let jumpTarget: number | null = null;
  const end = `+=${Math.max(180, beats.length * endPerBeat)}%`;

  function emit(progress: number) {
    const total = Math.max(1, beats.length - 1);
    const f = progress * total;
    const beatIndex = Math.min(total, Math.floor(f));
    const localT = beatIndex >= total ? 0 : f - beatIndex;
    const a = beats[beatIndex];
    const b = beats[Math.min(beatIndex + 1, beats.length - 1)];

    // During strip/hotspot jumps, hold destination look/FX so UI + camera don't thrash
    if (jumpTarget !== null) {
      const target = beats[jumpTarget];
      if (target) {
        onScrub?.({
          look: target.look,
          explode: target.explode,
          spin: target.spin,
          fx: target.fx,
          beatIndex: jumpTarget,
          progress,
        });
      }
      return;
    }

    onScrub?.({
      look: lerpLook(a.look, b.look, localT),
      explode: lerp(a.explode, b.explode, localT),
      spin: lerp(a.spin, b.spin, localT),
      fx: lerpFx(a.fx, b.fx, localT),
      beatIndex,
      progress,
    });

    if (beatIndex !== activeIndex) {
      activeIndex = beatIndex;
      onActiveBeat?.(a);
    }
  }

  const st = ScrollTrigger.create({
    trigger,
    start: pinStart,
    end,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate(self: { progress: number }) {
      emit(self.progress);
    },
    onToggle(self: { pin: HTMLElement | null; isActive: boolean }) {
      if (self.pin) self.pin.style.zIndex = self.isActive ? "40" : "";
      trigger.classList?.toggle?.("is-pinned", self.isActive);
      onPinToggle?.(self.isActive);
    },
  });

  emit(0);
  onActiveBeat?.(beats[0]);
  onPinToggle?.(st.isActive);

  function scrollToBeat(beatIndex: number) {
    const i = Math.max(0, Math.min(beats.length - 1, beatIndex));
    const total = Math.max(1, beats.length - 1);
    const progress = i / total;
    const y = st.start + progress * (st.end - st.start);
    const target = beats[i];

    jumpTarget = i;
    activeIndex = i;
    if (target) {
      onJumpToBeat?.(target);
      onActiveBeat?.(target);
      // Hold destination FX/look while scroll catches up (avoids mid-beat UI flicker)
      onScrub?.({
        look: target.look,
        explode: target.explode,
        spin: target.spin,
        fx: target.fx,
        beatIndex: i,
        progress,
      });
    }

    gsap.killTweensOf(window);
    gsap.to(window, {
      duration: 0.5,
      scrollTo: { y, autoKill: true },
      ease: "power2.inOut",
      overwrite: true,
      onComplete() {
        jumpTarget = null;
        emit(st.progress);
      },
    });
  }

  function kill() {
    gsap.killTweensOf(window);
    st.kill();
  }

  return {
    scrollToBeat,
    kill,
    getProgress: () => st.progress,
  };
}
