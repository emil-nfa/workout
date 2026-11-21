// Stretch routines: research/PROGRAM.md §9 (built from the July protocol, kept where the evidence supports it).
// Strong stretch with calm breathing (about 6/10), never pain; stop at once for tingling or numbness.
import type { StretchRoutine } from "./types";

const PNF = { rounds: 3, pushSec: 5, holdSec: 25, startHoldSec: 30 };

export const STRETCH_ROUTINES: StretchRoutine[] = [
  {
    id: "morning",
    name: "Morning",
    when: "Optional, 6 min: loosen up and set your posture",
    blocks: [
      {
        title: "Spine and hips",
        steps: [
          { exerciseId: "cat_cow", seconds: 0, sides: 1, reps: 8 },
          { exerciseId: "open_book", seconds: 0, sides: 2, reps: 6 },
          { exerciseId: "hip_flexor", seconds: 0, sides: 2, reps: 8, note: "Rock in and out, don't hold" },
          { exerciseId: "leg_swing", seconds: 0, sides: 2, reps: 10 },
        ],
      },
      {
        title: "Posture",
        steps: [
          { exerciseId: "wall_slide", seconds: 0, sides: 1, reps: 8 },
          { exerciseId: "chin_tuck", seconds: 0, sides: 1, reps: 10, note: "Hold each 3 s" },
        ],
      },
    ],
  },
  {
    id: "evening",
    name: "Evening",
    when: "The main flexibility work, 18 min, 5-7 evenings a week",
    blocks: [
      {
        title: "Warm-up",
        steps: [
          { exerciseId: "march", seconds: 30, sides: 1 },
          { exerciseId: "leg_swing", seconds: 0, sides: 2, reps: 8 },
        ],
      },
      {
        title: "Hamstrings",
        steps: [
          { exerciseId: "ham_strap", seconds: 120, sides: 2, pnf: PNF, note: "Push the heel into the strap at half effort, relax, pull deeper" },
          { exerciseId: "seated_pike", seconds: 45, sides: 1, note: "Flat back, chest forward" },
          { exerciseId: "seated_pike", seconds: 45, sides: 1, note: "Last one: relax fully into it" },
          { exerciseId: "pancake", seconds: 90, sides: 1, note: "30 s centre, 30 s over each leg" },
        ],
      },
      {
        title: "Hips and calves",
        steps: [
          { exerciseId: "hip_flexor", seconds: 45, sides: 2 },
          { exerciseId: "glute_fig4", seconds: 45, sides: 2 },
          { exerciseId: "calf_wall", seconds: 45, sides: 2, note: "30 s knee straight, then 15 s knee bent" },
        ],
      },
      {
        title: "Upper body",
        steps: [
          { exerciseId: "child_lat", seconds: 60, sides: 1, note: "20 s centre, 20 s right, 20 s left" },
          { exerciseId: "pec_door", seconds: 45, sides: 2, note: "For comfort, not a posture fix" },
          { exerciseId: "thoracic_roll", seconds: 60, sides: 1, note: "Roller or rolled towel" },
        ],
      },
    ],
  },
  {
    id: "fallback",
    name: "5-min fallback",
    when: "Tired day: keep the habit, never miss twice",
    blocks: [
      {
        title: "Minimum dose",
        steps: [
          { exerciseId: "ham_strap", seconds: 120, sides: 2, pnf: PNF },
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
