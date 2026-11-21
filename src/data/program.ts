// Default program: research/PROGRAM.md (M0, 21/11/2026). Citation ids live in research/RESEARCH.md.
import type { Program } from "./types";

export const DEFAULT_PROGRAM: Program = {
  id: "default-v1",
  name: "Upper / Lower rotation",
  rotation: ["A", "B", "C", "D"],
  // Final program after the M0 research: research/PROGRAM.md §3 (timed at 50-56 min, weeks 3+).
  sessions: [
    {
      key: "A", title: "Upper 1", subtitle: "Rows, press, pulldown", kind: "upper",
      slots: [
        { exerciseId: "row_chest", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "chest_press", sets: 3, repMin: 6, repMax: 10, restSec: 120 },
        { exerciseId: "lat_pulldown", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "db_shoulder", sets: 2, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "face_pull", sets: 3, repMin: 12, repMax: 20, restSec: 60 },
        { exerciseId: "db_curl", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
        { exerciseId: "pushdown", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
      ],
    },
    {
      key: "B", title: "Lower 1", subtitle: "Squat pattern and core", kind: "lower",
      slots: [
        { exerciseId: "leg_press", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "rdl", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "leg_curl_seated", sets: 3, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "leg_ext", sets: 2, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "calf_stand", sets: 3, repMin: 8, repMax: 15, restSec: 60 },
        { exerciseId: "pallof", sets: 2, repMin: 10, repMax: 10, perSide: true, restSec: 60, superset: "a" },
        { exerciseId: "dead_bug", sets: 2, repMin: 8, repMax: 8, perSide: true, restSec: 60, superset: "a" },
      ],
    },
    {
      key: "C", title: "Upper 2", subtitle: "Pull-ups, incline press, rear shoulders", kind: "upper",
      slots: [
        { exerciseId: "assisted_pullup", sets: 3, repMin: 6, repMax: 10, restSec: 120 },
        { exerciseId: "incline_db", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "db_row", sets: 3, repMin: 8, repMax: 12, perSide: true, restSec: 75 },
        { exerciseId: "reverse_pec", sets: 3, repMin: 12, repMax: 20, restSec: 60 },
        { exerciseId: "lateral_raise", sets: 3, repMin: 12, repMax: 20, restSec: 60 },
        { exerciseId: "hammer_curl", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
        { exerciseId: "oh_triceps", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
      ],
    },
    {
      key: "D", title: "Lower 2", subtitle: "Hinge pattern and core", kind: "lower",
      slots: [
        { exerciseId: "goblet_squat", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "back_ext", sets: 3, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "bulgarian", sets: 2, repMin: 8, repMax: 12, perSide: true, restSec: 90 },
        { exerciseId: "leg_curl_lying", sets: 3, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "calf_seated", sets: 3, repMin: 12, repMax: 20, restSec: 60, superset: "a" },
        { exerciseId: "cable_crunch", sets: 3, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
      ],
    },
    {
      key: "E", title: "Bonus", subtitle: "Optional 5th day: posture, arms, carries", kind: "upper", optional: true,
      slots: [
        { exerciseId: "cable_row", sets: 3, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "face_pull", sets: 2, repMin: 15, repMax: 20, restSec: 75, superset: "a" },
        { exerciseId: "pushup", sets: 2, repMin: 8, repMax: 20, restSec: 75, superset: "a" },
        { exerciseId: "lateral_raise", sets: 2, repMin: 15, repMax: 20, restSec: 60 },
        { exerciseId: "db_curl", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "b" },
        { exerciseId: "pushdown", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "b" },
        { exerciseId: "farmer", sets: 3, repMin: 30, repMax: 40, target: "30-40 m", restSec: 90 },
        { exerciseId: "knee_raise", sets: 2, repMin: 8, repMax: 15, restSec: 60, superset: "c" },
        { exerciseId: "side_plank", sets: 2, repMin: 20, repMax: 40, target: "20-40 s", perSide: true, restSec: 60, superset: "c" },
      ],
    },
  ],
};

/** research/PROGRAM.md §6. Ramp-up sets on the first exercise follow the general warm-up. */
export const WARMUPS: Record<"upper" | "lower", string[]> = {
  upper: [
    "4 min easy bike or rower (you can still talk)",
    "Band pull-apart ×15",
    "Wall angel ×8, slow",
    "Chin tuck ×10, hold 3 s",
    "First exercise: 8 reps at ~50 %, then 4 reps at ~75 %",
  ],
  lower: [
    "4 min easy bike",
    "Leg swings ×10 each leg",
    "Single-leg Romanian deadlift, bodyweight ×6 each leg, 3 s down",
    "Bird-dog ×6 each side, slow",
    "Bodyweight squat ×10, 2 s pause at the bottom",
    "First exercise: 8 reps at ~50 %, then 4 reps at ~75 %",
  ],
};
