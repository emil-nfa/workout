// Stretch routines: v1 morning routine + the July 2026 evening protocol + its 5-min fallback.
// Draft until M0 research (research/PROGRAM.md) confirms doses; intensity 6-7/10, never pain.
import type { StretchRoutine } from "./types";

export const STRETCH_ROUTINES: StretchRoutine[] = [
  {
    id: "morning",
    name: "Morning",
    when: "Moving mobility to unstiffen and set your posture",
    blocks: [
      {
        title: "Wake up",
        steps: [
          { exerciseId: "cat_cow", seconds: 0, sides: 1, reps: 8 },
          { exerciseId: "open_book", seconds: 0, sides: 2, reps: 6 },
          { exerciseId: "hip_flexor", seconds: 0, sides: 2, reps: 8, note: "Dynamic: rock in and out" },
          { exerciseId: "leg_swing", seconds: 0, sides: 2, reps: 10 },
        ],
      },
      {
        title: "Posture",
        steps: [
          { exerciseId: "wall_slide", seconds: 0, sides: 1, reps: 10 },
          { exerciseId: "chin_tuck", seconds: 0, sides: 1, reps: 10, note: "Hold each 3 s" },
        ],
      },
    ],
  },
  {
    id: "evening",
    name: "Evening",
    when: "Longer holds for flexibility",
    blocks: [
      {
        title: "Warm-up",
        steps: [
          { exerciseId: "march", seconds: 30, sides: 1 },
          { exerciseId: "leg_swing", seconds: 0, sides: 2, reps: 15 },
          { exerciseId: "cat_cow", seconds: 0, sides: 1, reps: 8 },
        ],
      },
      {
        title: "Hamstrings",
        steps: [
          {
            exerciseId: "ham_strap", seconds: 120, sides: 2,
            pnf: { rounds: 3, pushSec: 5, holdSec: 25, startHoldSec: 30 },
            note: "Push the heel into the strap at half effort, relax, pull deeper",
          },
          { exerciseId: "elephant_walk", seconds: 90, sides: 1 },
          { exerciseId: "seated_pike", seconds: 45, sides: 1, note: "3 rounds, 15 s rest; relax fully on the last" },
          { exerciseId: "seated_pike", seconds: 45, sides: 1 },
          { exerciseId: "seated_pike", seconds: 45, sides: 1 },
        ],
      },
      {
        title: "Hips and calves",
        steps: [
          { exerciseId: "pancake", seconds: 90, sides: 1, note: "30 s centre, 30 s right, 30 s left" },
          { exerciseId: "butterfly", seconds: 60, sides: 1 },
          { exerciseId: "hip_flexor", seconds: 45, sides: 2 },
          { exerciseId: "glute_fig4", seconds: 45, sides: 2 },
          { exerciseId: "dog_pedal", seconds: 60, sides: 1 },
        ],
      },
      {
        title: "Upper back",
        steps: [
          { exerciseId: "thoracic_roll", seconds: 60, sides: 1, note: "Roller or rolled towel" },
          { exerciseId: "open_book", seconds: 30, sides: 2 },
        ],
      },
    ],
  },
  {
    id: "fallback",
    name: "5-min fallback",
    when: "Tired day: keep the habit",
    blocks: [
      {
        title: "Minimum dose",
        steps: [
          {
            exerciseId: "ham_strap", seconds: 120, sides: 2,
            pnf: { rounds: 3, pushSec: 5, holdSec: 25, startHoldSec: 30 },
          },
          { exerciseId: "seated_pike", seconds: 60, sides: 1 },
        ],
      },
    ],
  },
];

/** Rough duration of a routine in seconds (rep steps counted at 3 s per rep, 5 s get-ready per step). */
export function routineSeconds(r: StretchRoutine): number {
  let t = 0;
  for (const b of r.blocks)
    for (const s of b.steps) {
      const one = s.seconds > 0 ? s.seconds : (s.reps ?? 0) * 3;
      t += one * s.sides + 5;
    }
  return t;
}
