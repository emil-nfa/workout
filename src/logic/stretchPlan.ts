// Turns a stretch routine into a flat timeline of segments for the guided player. Pure and unit-tested.
// Segment kinds: get ready, hold (timed), reps (wait for Done), PNF push / relax, switch sides.
import type { StretchRoutine } from "../data/types";
import { EXERCISE_BY_ID } from "../data/exercises";

export type SegKind = "ready" | "hold" | "reps" | "push" | "relax" | "switch";

export interface Segment {
  kind: SegKind;
  step: number; // index into the flat step list
  block: number; // index of the block (for the segmented progress bar)
  exerciseId: string;
  side?: "right" | "left";
  /** Seconds; 0 for reps (the user taps Done). */
  dur: number;
  reps?: number;
  /** Spoken when the segment starts. */
  say: string;
  /** Big label on screen. */
  label: string;
}

export const READY_SEC = 5;
export const SWITCH_SEC = 4;

export function buildTimeline(r: StretchRoutine): Segment[] {
  const out: Segment[] = [];
  let step = 0;
  r.blocks.forEach((b, block) => {
    for (const s of b.steps) {
      const name = EXERCISE_BY_ID[s.exerciseId]?.name ?? s.exerciseId;
      const sides: ("right" | "left" | undefined)[] = s.sides === 2 ? ["right", "left"] : [undefined];
      const base = { step, block, exerciseId: s.exerciseId };
      out.push({ ...base, kind: "ready", dur: READY_SEC, say: `Get ready: ${name}${s.sides === 2 ? ", right side first" : ""}`, label: "Get ready" });
      sides.forEach((side, i) => {
        if (i > 0) out.push({ ...base, kind: "switch", side, dur: SWITCH_SEC, say: "Switch sides", label: "Switch sides" });
        if (s.reps && !s.seconds) {
          out.push({ ...base, kind: "reps", side, dur: 0, reps: s.reps, say: `${s.reps} reps${side ? `, ${side} side` : ""}`, label: `${s.reps} reps` });
        } else if (s.pnf) {
          const p = s.pnf;
          out.push({ ...base, kind: "hold", side, dur: p.startHoldSec, say: "Hold. Breathe slowly.", label: "Hold" });
          for (let k = 0; k < p.rounds; k++) {
            out.push({ ...base, kind: "push", side, dur: p.pushSec, say: "Push the heel into the strap, half effort", label: "Push" });
            out.push({ ...base, kind: "relax", side, dur: p.holdSec, say: "Relax, breathe out, go a little deeper", label: "Relax deeper" });
          }
        } else {
          out.push({ ...base, kind: "hold", side, dur: s.seconds, say: s.note ? `Hold. ${s.note}` : "Hold. Breathe slowly.", label: "Hold" });
        }
      });
      step++;
    }
  });
  return out;
}

export interface PlayerClock {
  seg: number;
  segStartedAt: number; // epoch ms (adjusted for pauses)
  pausedAt?: number;
}

/**
 * Advances the clock to `now`: timed segments that have ended roll over (so it is right after the phone was locked).
 * Reps segments never end on their own. Returns the new clock and the segments that just started (for speech).
 */
export function advance(tl: Segment[], c: PlayerClock, now: number): { clock: PlayerClock; started: number[] } {
  if (c.pausedAt !== undefined) return { clock: c, started: [] };
  let { seg, segStartedAt } = c;
  const started: number[] = [];
  while (seg < tl.length && tl[seg].dur > 0 && now - segStartedAt >= tl[seg].dur * 1000) {
    segStartedAt += tl[seg].dur * 1000;
    seg++;
    started.push(seg);
  }
  return { clock: { seg, segStartedAt }, started };
}

export const remaining = (tl: Segment[], c: PlayerClock, now: number) => {
  const s = tl[c.seg];
  if (!s || s.dur === 0) return 0;
  const t = (c.pausedAt ?? now) - c.segStartedAt;
  return Math.max(0, s.dur - t / 1000);
};

export const pause = (c: PlayerClock, now: number): PlayerClock => (c.pausedAt !== undefined ? c : { ...c, pausedAt: now });
export const resume = (c: PlayerClock, now: number): PlayerClock => (c.pausedAt === undefined ? c : { seg: c.seg, segStartedAt: c.segStartedAt + (now - c.pausedAt) });

/** Jump to the start of the next / previous exercise (its "get ready" segment). */
export function jump(tl: Segment[], c: PlayerClock, now: number, dir: 1 | -1): PlayerClock {
  const step = tl[Math.min(c.seg, tl.length - 1)]?.step ?? 0;
  const target = dir === 1 ? step + 1 : tl[c.seg]?.kind === "ready" || now - c.segStartedAt < 2000 ? step - 1 : step;
  const i = tl.findIndex((s) => s.step === Math.max(0, target));
  const seg = i < 0 ? tl.length : i;
  return { seg, segStartedAt: now, pausedAt: c.pausedAt !== undefined ? now : undefined };
}

export const totalSeconds = (tl: Segment[]) => tl.reduce((a, s) => a + (s.dur || (s.reps ?? 0) * 3), 0);
