// Default program: the v1 upper/lower rotation, ported 21/11/2026.
// M0 research (research/PROGRAM.md) will revise sets, reps and exercises; edit here with citation ids.
import type { Program } from "./types";

export const DEFAULT_PROGRAM: Program = {
  id: "default-v1",
  name: "Upper / Lower rotation",
  rotation: ["A", "B", "C", "D"],
  sessions: [
    {
      key: "A", title: "Upper 1", subtitle: "Rows, press, pulldown", kind: "upper",
      slots: [
        { exerciseId: "row_chest", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "chest_press", sets: 3, repMin: 6, repMax: 10, restSec: 150 },
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
        { exerciseId: "leg_press", sets: 3, repMin: 8, repMax: 12, restSec: 150 },
        { exerciseId: "rdl", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "leg_curl_seated", sets: 3, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "leg_ext", sets: 2, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "calf_stand", sets: 3, repMin: 8, repMax: 15, restSec: 60 },
        { exerciseId: "pallof", sets: 2, repMin: 10, repMax: 10, perSide: true, restSec: 60 },
        { exerciseId: "dead_bug", sets: 2, repMin: 8, repMax: 8, perSide: true, restSec: 60 },
      ],
    },
    {
      key: "C", title: "Upper 2", subtitle: "Pull-ups, incline press, rear shoulders", kind: "upper",
      slots: [
        { exerciseId: "assisted_pullup", sets: 3, repMin: 6, repMax: 10, restSec: 150 },
        { exerciseId: "incline_db", sets: 3, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: "db_row", sets: 3, repMin: 8, repMax: 12, perSide: true, restSec: 90 },
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
        { exerciseId: "calf_seated", sets: 3, repMin: 12, repMax: 20, restSec: 60 },
        { exerciseId: "cable_crunch", sets: 3, repMin: 10, repMax: 15, restSec: 60 },
        { exerciseId: "knee_raise", sets: 2, repMin: 8, repMax: 15, restSec: 60 },
      ],
    },
    {
      key: "E", title: "Bonus", subtitle: "Optional 5th day: posture, arms, carries", kind: "upper", optional: true,
      slots: [
        { exerciseId: "cable_row", sets: 3, repMin: 10, repMax: 15, restSec: 90 },
        { exerciseId: "face_pull", sets: 2, repMin: 15, repMax: 20, restSec: 60 },
        { exerciseId: "pushup", sets: 2, repMin: 8, repMax: 20, restSec: 90 },
        { exerciseId: "lateral_raise", sets: 2, repMin: 15, repMax: 20, restSec: 60 },
        { exerciseId: "db_curl", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
        { exerciseId: "pushdown", sets: 2, repMin: 10, repMax: 15, restSec: 60, superset: "a" },
        { exerciseId: "farmer", sets: 3, repMin: 30, repMax: 40, target: "30-40 m", restSec: 90 },
        { exerciseId: "side_plank", sets: 2, repMin: 20, repMax: 40, target: "20-40 s", perSide: true, restSec: 60 },
      ],
    },
  ],
};

export const WARMUPS: Record<"upper" | "lower", string[]> = {
  upper: [
    "5 min easy bike or rower",
    "Band pull-apart ×15",
    "Wall slide ×10",
    "Chin tuck ×10",
    "First exercise: 8 reps at ~50 %, then 4 reps at ~75 %",
  ],
  lower: [
    "5 min easy bike or incline walk",
    "Leg swings ×10 each leg",
    "Bodyweight squat ×10, pause at the bottom",
    "Cat-cow ×8",
    "First exercise: 8 reps at ~50 %, then 4 reps at ~75 %",
  ],
};
