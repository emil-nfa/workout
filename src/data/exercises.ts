// Exercise content, ported from v1 on 21/11/2026. Research updates (M0) land here with citation ids.
// Generated once by scripts/extract-v1.mjs + a one-off script; edit by hand from now on.
import type { Exercise } from "./types";

export const EXERCISES: Exercise[] = [
  {
    "id": "row_chest",
    "name": "Chest-supported row",
    "fr": "Rowing assis buste appuyé (machine)",
    "group": "Back",
    "muscles": "Mid back, lats, rear shoulders, biceps",
    "equipment": "Technogym / Hammer \"Low Row\" or \"Row\" plate-loaded machine with a chest pad",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "upperBack",
      "lats"
    ],
    "secondary": [
      "rearDelts",
      "biceps"
    ],
    "how": [
      "Set the seat so the handles are at lower-chest height. Chest stays glued to the pad.",
      "Start with arms straight and shoulders allowed to drift forward (a full stretch).",
      "Pull elbows back past your ribs, squeezing your shoulder blades together and down.",
      "Pause 1 second, then let the weight go back slowly (2-3 s)."
    ],
    "cues": [
      "Think \"elbows to back pockets\", not \"hands to chest\".",
      "Keep your chin tucked, neck long."
    ],
    "avoid": [
      "Lifting the chest off the pad to swing the weight.",
      "Shrugging shoulders up to the ears."
    ],
    "alternative": "Chest-supported dumbbell row on an incline bench",
    "posture": true,
    "machine": "Hammer Strength Iso-Lateral Low Row / Row (plate-loaded) or Technogym Low Row (stack)",
    "sources": [
      "R-post-3",
      "R-vol-1"
    ]
  },
  {
    "id": "chest_press",
    "name": "Machine chest press",
    "fr": "Développé couché assis (Chest Press)",
    "group": "Chest",
    "muscles": "Chest, front shoulders, triceps",
    "equipment": "Technogym \"Chest Press\" (selectorised)",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "chest"
    ],
    "secondary": [
      "frontDelts",
      "triceps"
    ],
    "how": [
      "Seat height: handles level with mid-chest.",
      "Pull shoulder blades back and down into the pad before you start, and keep them there.",
      "Press until arms are straight but not locked hard.",
      "Return slowly until you feel a stretch across the chest."
    ],
    "cues": [
      "Wrists straight over elbows.",
      "Feet flat, back on the pad."
    ],
    "avoid": [
      "Shoulders rolling forward at the end of each rep (bad for your posture goal).",
      "Bouncing out of the bottom."
    ],
    "alternative": "Dumbbell bench press, flat bench",
    "machine": "Technogym Chest Press (stack) or Hammer Iso-Lateral Chest Press",
    "sources": [
      "R-load-2"
    ]
  },
  {
    "id": "lat_pulldown",
    "name": "Lat pulldown",
    "fr": "Tirage vertical / Tirage poitrine",
    "group": "Back",
    "muscles": "Lats (wide back), biceps, lower traps",
    "equipment": "Technogym \"Lat Machine\" / pulldown station",
    "loadType": "stack",
    "tags": [
      "cable",
      "machine"
    ],
    "where": "gym",
    "primary": [
      "lats"
    ],
    "secondary": [
      "biceps",
      "upperBack"
    ],
    "how": [
      "Grip a bit wider than shoulders, thighs locked under the pad.",
      "Lean back slightly (about 10-15°).",
      "Pull the bar to your upper chest by driving elbows down to your sides.",
      "Let it rise all the way until arms are straight and you feel your sides stretch."
    ],
    "cues": [
      "Chest up toward the bar.",
      "Shoulders down, away from ears, before the arms bend."
    ],
    "avoid": [
      "Pulling the bar behind the neck.",
      "Leaning back so far it becomes a row."
    ],
    "alternative": "Kneeling one-arm pulldown at the cable pulley",
    "posture": true,
    "machine": "Technogym Lat Machine / Pulldown or Hammer Iso-Lateral Front Pulldown",
    "sources": [
      "R-rom-2"
    ]
  },
  {
    "id": "assisted_pullup",
    "name": "Assisted pull-up",
    "fr": "Tractions assistées (machine)",
    "group": "Back",
    "muscles": "Lats, mid back, biceps, core",
    "equipment": "Technogym / Hammer \"Assisted Chin-Dip\" machine (kneel on the pad)",
    "loadType": "assisted",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "lats",
      "upperBack"
    ],
    "secondary": [
      "biceps",
      "abs"
    ],
    "how": [
      "More counterweight = more help. Pick the assistance so you reach the rep target with 1-2 reps left.",
      "Kneel on the pad, hands slightly wider than shoulders (or neutral grip handles).",
      "Pull your chest to the bar, then lower all the way to straight arms."
    ],
    "cues": [
      "Start each rep by pulling shoulders down.",
      "Body stays still, no kicking."
    ],
    "avoid": [
      "Half reps that stop with bent arms."
    ],
    "alternative": "Lat pulldown, neutral (palms facing) grip",
    "progression": "Each time you hit the top of the range, REDUCE the assistance by one plate.",
    "machine": "Assisted chin/dip machine (Technogym or similar), knee pad",
    "sources": [
      "R-load-2"
    ]
  },
  {
    "id": "incline_db",
    "name": "Incline dumbbell press",
    "fr": "Développé incliné haltères",
    "group": "Chest",
    "muscles": "Upper chest, front shoulders, triceps",
    "equipment": "Adjustable bench set to 30° + dumbbells",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell",
      "bench"
    ],
    "where": "gym",
    "primary": [
      "chest"
    ],
    "secondary": [
      "frontDelts",
      "triceps"
    ],
    "how": [
      "Bench at about 30° (2nd or 3rd notch). Sit, rest dumbbells on your thighs, then lie back bringing them to your chest.",
      "Press up and slightly in until arms are straight over your shoulders.",
      "Lower slowly until the dumbbells are beside your chest and you feel a stretch."
    ],
    "cues": [
      "Elbows about 45° from your body, not flared straight out.",
      "Shoulder blades pinned back on the bench."
    ],
    "avoid": [
      "Bench too steep (becomes a shoulder press).",
      "Clanking dumbbells at the top."
    ],
    "alternative": "Technogym Incline Press or Hammer Iso-Lateral Incline Press",
    "machine": "Incline bench + dumbbells",
    "sources": [
      "R-load-1"
    ]
  },
  {
    "id": "db_shoulder",
    "name": "Seated dumbbell shoulder press",
    "fr": "Développé militaire haltères assis",
    "group": "Shoulders",
    "muscles": "Front and side shoulders, triceps, upper chest",
    "equipment": "Bench set almost upright (80-90°) + dumbbells",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell",
      "bench"
    ],
    "where": "gym",
    "primary": [
      "frontDelts",
      "sideDelts"
    ],
    "secondary": [
      "triceps"
    ],
    "how": [
      "Back against the pad, dumbbells at shoulder height, palms facing forward.",
      "Press straight up until arms are straight.",
      "Lower to about chin/ear level."
    ],
    "cues": [
      "Ribs down, don't arch your lower back.",
      "Forearms vertical."
    ],
    "avoid": [
      "Arching back to push the weight."
    ],
    "alternative": "Technogym Shoulder Press (stack)",
    "machine": "Adjustable bench almost upright + dumbbells",
    "sources": [
      "R-load-1"
    ]
  },
  {
    "id": "face_pull",
    "name": "Face pull",
    "fr": "Face pull (poulie haute, corde)",
    "group": "Posture",
    "muscles": "Rear shoulders, mid/upper back, rotator cuff",
    "equipment": "Cable station, rope attachment, pulley at forehead height",
    "loadType": "stack",
    "tags": [
      "cable"
    ],
    "where": "gym",
    "primary": [
      "rearDelts",
      "upperBack"
    ],
    "secondary": [
      "traps"
    ],
    "how": [
      "Rope at forehead height, grip with thumbs pointing back toward you.",
      "Step back so the weight lifts, stand tall.",
      "Pull the rope toward your eyes, splitting the ends apart, elbows high and wide.",
      "Finish like a \"double biceps\" pose, hold 1 s, return slowly."
    ],
    "cues": [
      "Hands end beside your ears.",
      "Light weight, perfect form: this one is for your shoulders, not your ego."
    ],
    "avoid": [
      "Leaning back and yanking with the body.",
      "Elbows dropping below the hands."
    ],
    "alternative": "Band pull-apart",
    "posture": true,
    "machine": "Cable pulley",
    "sources": [
      "R-post-1"
    ]
  },
  {
    "id": "reverse_pec",
    "name": "Reverse pec deck (rear delt fly)",
    "fr": "Oiseau à la machine (Reverse Fly / Rear Delt)",
    "group": "Posture",
    "muscles": "Rear shoulders, mid back (rhomboids, middle traps)",
    "equipment": "Technogym \"Pectoral / Rear Delt\" machine, sitting facing the pad",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "rearDelts",
      "upperBack"
    ],
    "secondary": [],
    "how": [
      "Sit facing the machine, chest on the pad, handles at shoulder height.",
      "With almost straight arms, sweep the handles out and back in a wide arc.",
      "Stop when arms are in line with your body, squeeze 1 s, return slowly."
    ],
    "cues": [
      "Lead with the elbows, not the hands.",
      "Keep shoulders down."
    ],
    "avoid": [
      "Shrugging up.",
      "Swinging with momentum."
    ],
    "alternative": "Cable reverse fly on the facing pulleys",
    "posture": true,
    "machine": "Technogym Pectoral / Rear Delt machine, facing the pad",
    "sources": [
      "R-post-1"
    ]
  },
  {
    "id": "lateral_raise",
    "name": "Dumbbell lateral raise",
    "fr": "Élévations latérales haltères",
    "group": "Shoulders",
    "muscles": "Side shoulders (width)",
    "equipment": "Light dumbbells (or a low cable)",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell"
    ],
    "where": "gym",
    "primary": [
      "sideDelts"
    ],
    "secondary": [],
    "how": [
      "Stand tall, dumbbells at your sides, slight bend in elbows.",
      "Raise arms out to the sides up to shoulder height.",
      "Lower slowly over 2-3 seconds."
    ],
    "cues": [
      "Imagine pushing the dumbbells out to the walls, not up.",
      "Pinkies roughly level with thumbs."
    ],
    "avoid": [
      "Swinging with the hips.",
      "Going far above shoulder height."
    ],
    "alternative": "Cable lateral raise",
    "machine": "Dumbbells",
    "sources": [
      "R-load-1"
    ]
  },
  {
    "id": "db_row",
    "name": "One-arm dumbbell row",
    "fr": "Rowing haltère un bras",
    "group": "Back",
    "muscles": "Lats, mid back, rear shoulders, biceps",
    "equipment": "Flat bench + dumbbell",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell",
      "bench"
    ],
    "where": "gym",
    "primary": [
      "lats",
      "upperBack"
    ],
    "secondary": [
      "rearDelts",
      "biceps"
    ],
    "how": [
      "Same-side knee and hand on the bench, other foot on the floor. Back flat like a table.",
      "Let the dumbbell hang straight down (full stretch).",
      "Pull it toward your hip, elbow close to your body.",
      "Lower under control. Do all reps on one side, then switch."
    ],
    "cues": [
      "Pull to the hip, not to the armpit.",
      "Don't twist your torso open."
    ],
    "avoid": [
      "Rounded back.",
      "Jerking the weight up."
    ],
    "alternative": "Hammer Iso-Lateral Row, one arm at a time",
    "posture": true,
    "machine": "Flat bench + dumbbell",
    "sources": [
      "R-post-3"
    ]
  },
  {
    "id": "cable_row",
    "name": "Seated cable row (wide grip)",
    "fr": "Tirage horizontal poulie basse",
    "group": "Back",
    "muscles": "Mid back, rear shoulders, lats",
    "equipment": "Low cable row station with a wide bar",
    "loadType": "stack",
    "tags": [
      "cable"
    ],
    "where": "gym",
    "primary": [
      "upperBack",
      "lats"
    ],
    "secondary": [
      "rearDelts"
    ],
    "how": [
      "Sit tall, knees slightly bent, feet on the plate.",
      "Arms straight, let your shoulder blades slide forward.",
      "Pull the bar to your lower chest with elbows flaring out about 60° (works the upper back).",
      "Squeeze shoulder blades together, then return slowly."
    ],
    "cues": [
      "Torso stays nearly still.",
      "Chest proud at the end."
    ],
    "avoid": [
      "Rocking back and forth to move the weight."
    ],
    "alternative": "Chest-supported row",
    "posture": true,
    "machine": "Low cable row station (Technogym Low Row or cable)",
    "sources": [
      "R-post-3"
    ]
  },
  {
    "id": "db_curl",
    "name": "Dumbbell curl",
    "fr": "Curl haltères",
    "group": "Arms",
    "muscles": "Biceps",
    "equipment": "Dumbbells",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell"
    ],
    "where": "both",
    "primary": [
      "biceps"
    ],
    "secondary": [],
    "how": [
      "Stand tall, palms forward.",
      "Curl the dumbbells up without moving your elbows forward.",
      "Lower fully until arms are straight (that stretch matters)."
    ],
    "cues": [
      "Elbows pinned to your sides."
    ],
    "avoid": [
      "Swinging the body.",
      "Half reps at the bottom."
    ],
    "alternative": "Cable curl",
    "machine": "Dumbbells",
    "sources": [
      "R-vol-1"
    ]
  },
  {
    "id": "hammer_curl",
    "name": "Hammer curl",
    "fr": "Curl marteau",
    "group": "Arms",
    "muscles": "Biceps, brachialis, forearms",
    "equipment": "Dumbbells",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell"
    ],
    "where": "both",
    "primary": [
      "biceps",
      "forearms"
    ],
    "secondary": [],
    "how": [
      "Like a curl, but palms face each other (like holding a hammer).",
      "Curl up, lower fully."
    ],
    "cues": [
      "Elbows stay put."
    ],
    "avoid": [
      "Swinging."
    ],
    "alternative": "Rope cable curl",
    "machine": "Dumbbells",
    "sources": [
      "R-vol-1"
    ]
  },
  {
    "id": "pushdown",
    "name": "Triceps rope pushdown",
    "fr": "Extension triceps poulie haute (corde)",
    "group": "Arms",
    "muscles": "Triceps",
    "equipment": "Cable station, rope, pulley at the top",
    "loadType": "stack",
    "tags": [
      "cable"
    ],
    "where": "gym",
    "primary": [
      "triceps"
    ],
    "secondary": [],
    "how": [
      "Face the pulley, slight forward lean, elbows by your sides.",
      "Push the rope down until arms are straight, spreading the ends at the bottom.",
      "Let it come back up until forearms pass horizontal."
    ],
    "cues": [
      "Only the forearms move."
    ],
    "avoid": [
      "Elbows drifting forward and back."
    ],
    "alternative": "Bench dip",
    "machine": "Cable pulley",
    "sources": [
      "R-ss-1"
    ]
  },
  {
    "id": "oh_triceps",
    "name": "Overhead cable triceps extension",
    "fr": "Extension triceps au-dessus de la tête (poulie)",
    "group": "Arms",
    "muscles": "Triceps (especially the long head)",
    "equipment": "Cable station, rope, pulley at head height or lower; face away from it",
    "loadType": "stack",
    "tags": [
      "cable"
    ],
    "where": "gym",
    "primary": [
      "triceps"
    ],
    "secondary": [],
    "how": [
      "Face away from the pulley in a split stance, rope behind your head.",
      "Elbows point forward and stay fixed.",
      "Straighten the arms forward and up, then let the rope pull your hands back behind your head for a deep stretch."
    ],
    "cues": [
      "Elbows stay narrow."
    ],
    "avoid": [
      "Elbows flaring wide.",
      "Arching the lower back."
    ],
    "alternative": "One dumbbell overhead extension, seated",
    "machine": "Cable pulley at head height, rope",
    "sources": [
      "R-ss-1"
    ]
  },
  {
    "id": "pushup",
    "name": "Push-up",
    "fr": "Pompes",
    "group": "Chest",
    "muscles": "Chest, triceps, front shoulders, core",
    "equipment": "Floor (anywhere)",
    "loadType": "bodyweight",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "chest"
    ],
    "secondary": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "how": [
      "Hands a bit wider than shoulders, body in one straight line from head to heels.",
      "Lower until your chest is a fist from the floor.",
      "Push back up, spreading the floor apart with your hands."
    ],
    "cues": [
      "Squeeze glutes and abs, like a moving plank."
    ],
    "avoid": [
      "Hips sagging.",
      "Elbows flared at 90°."
    ],
    "alternative": "Knee push-up",
    "machine": "Floor",
    "sources": [
      "R-ss-1"
    ]
  },
  {
    "id": "leg_press",
    "name": "Leg press (45°)",
    "fr": "Presse à cuisses inclinée",
    "group": "Legs",
    "muscles": "Quads, glutes, adductors",
    "equipment": "Technogym / Hammer 45° plate-loaded leg press (or Technogym \"Leg Press\" seated)",
    "loadType": "plate",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "quads",
      "glutes"
    ],
    "secondary": [
      "adductors"
    ],
    "how": [
      "Back and hips flat on the pad. Feet shoulder-width in the middle of the platform.",
      "Release the safety handles. Lower the platform until knees come toward your chest, as deep as you can WITHOUT your lower back peeling off the pad.",
      "Push back up through the whole foot. Stop just short of locking the knees.",
      "Put the safeties back on before getting out."
    ],
    "cues": [
      "Knees track over your toes.",
      "Control the way down (2-3 s)."
    ],
    "avoid": [
      "Lower back rounding off the seat at the bottom.",
      "Locking knees hard at the top."
    ],
    "alternative": "Smith-machine squat in a guided cage",
    "machine": "Hammer Strength or Gym80 45° plate-loaded leg press, or Technogym Leg Press (stack)",
    "sources": [
      "R-load-1"
    ]
  },
  {
    "id": "hack_squat",
    "name": "Hack squat (machine)",
    "fr": "Hack squat (presse à squat guidée)",
    "group": "Legs",
    "muscles": "Quads, glutes, adductors",
    "equipment": "Plate-loaded hack squat machine (sled on 45° rails)",
    "loadType": "plate",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "quads",
      "glutes"
    ],
    "secondary": [
      "adductors"
    ],
    "how": [
      "Back flat on the pad, shoulders under the shoulder pads, feet shoulder-width in the middle of the platform, toes slightly out.",
      "Stand up to lift the sled and release the safety handles.",
      "Bend your knees and let the sled slide down until your thighs are at least parallel to the platform, as deep as your lower back stays on the pad.",
      "Push back up through the whole foot. Stop just short of locking the knees, then lock the safeties before stepping out."
    ],
    "cues": [
      "Knees follow your toes.",
      "Lower in 2-3 s, no bounce at the bottom."
    ],
    "avoid": [
      "Heels lifting off the platform.",
      "Lower back or hips peeling off the pad at the bottom."
    ],
    "alternative": "Leg press",
    "machine": "Plate-loaded hack squat (Hammer Strength or similar)",
    "sources": [
      "R-load-1"
    ]
  },
  {
    "id": "goblet_squat",
    "name": "Goblet squat",
    "fr": "Squat goblet (haltère)",
    "group": "Legs",
    "muscles": "Quads, glutes, core, upper back",
    "equipment": "One dumbbell or kettlebell held at the chest",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell"
    ],
    "where": "both",
    "primary": [
      "quads",
      "glutes"
    ],
    "secondary": [
      "abs",
      "upperBack"
    ],
    "how": [
      "Hold a dumbbell vertically against your chest, feet shoulder-width, toes slightly out.",
      "Sit down between your heels, knees pushing outward, chest up.",
      "Go as low as you can with a neutral back (thighs at least parallel), then stand up."
    ],
    "cues": [
      "Elbows inside the knees at the bottom.",
      "Weight over mid-foot, heels down."
    ],
    "avoid": [
      "Heels lifting.",
      "Knees caving inward."
    ],
    "alternative": "Leg press",
    "progression": "When the heaviest comfortable dumbbell (~30+ kg) is too easy for 12 reps, switch to hack squat or barbell back squat (ask a coach to check your form the first time).",
    "machine": "Dumbbell or kettlebell",
    "sources": [
      "R-load-1"
    ]
  },
  {
    "id": "rdl",
    "name": "Romanian deadlift (dumbbells)",
    "fr": "Soulevé de terre roumain haltères",
    "group": "Legs",
    "muscles": "Hamstrings, glutes, lower back",
    "equipment": "Two dumbbells",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell"
    ],
    "where": "both",
    "primary": [
      "hamstrings",
      "glutes"
    ],
    "secondary": [
      "lowerBack"
    ],
    "how": [
      "Stand with dumbbells in front of your thighs, knees soft.",
      "Push your hips BACK (like closing a car door with your bum), sliding the dumbbells down your legs.",
      "Go down until you feel a strong hamstring stretch, usually just below the knees, back flat.",
      "Drive hips forward to stand up, squeeze glutes."
    ],
    "cues": [
      "It's a hip hinge, not a squat: knees barely bend more.",
      "Dumbbells stay close to your legs."
    ],
    "avoid": [
      "Rounding the back to reach lower.",
      "Turning it into a squat."
    ],
    "alternative": "Barbell RDL in a cage",
    "machine": "Dumbbells",
    "sources": [
      "R-str-8",
      "R-fail-1"
    ]
  },
  {
    "id": "leg_curl_seated",
    "name": "Seated leg curl",
    "fr": "Leg curl assis",
    "group": "Legs",
    "muscles": "Hamstrings",
    "equipment": "Technogym \"Leg Curl\" (seated)",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "hamstrings"
    ],
    "secondary": [],
    "how": [
      "Line your knee up with the machine's pivot point. Lower the thigh pad so you are locked in.",
      "Roller just above the heels.",
      "Curl your heels down and back as far as possible, pause, return slowly to straight legs."
    ],
    "cues": [
      "Lean your torso slightly forward: it stretches the hamstrings more."
    ],
    "avoid": [
      "Hips lifting off the seat."
    ],
    "alternative": "Lying leg curl",
    "machine": "Technogym Leg Curl (stack)",
    "sources": [
      "R-vol-1"
    ]
  },
  {
    "id": "leg_curl_lying",
    "name": "Lying leg curl",
    "fr": "Leg curl allongé",
    "group": "Legs",
    "muscles": "Hamstrings, calves",
    "equipment": "Lying leg curl machine",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "hamstrings"
    ],
    "secondary": [
      "calves"
    ],
    "how": [
      "Lie face down, knees just off the end of the pad, roller above the heels.",
      "Curl heels toward your bum, pause.",
      "Lower slowly all the way."
    ],
    "cues": [
      "Hips pressed into the pad."
    ],
    "avoid": [
      "Hips popping up."
    ],
    "alternative": "Seated leg curl",
    "machine": "Lying leg curl machine",
    "sources": [
      "R-vol-1"
    ]
  },
  {
    "id": "leg_ext",
    "name": "Leg extension",
    "fr": "Leg extension",
    "group": "Legs",
    "muscles": "Quads",
    "equipment": "Technogym \"Leg Extension\"",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "quads"
    ],
    "secondary": [],
    "how": [
      "Knee in line with the pivot, pad on the lower shin.",
      "Straighten your legs fully, squeeze 1 s.",
      "Lower slowly until knees are well bent."
    ],
    "cues": [
      "Hold the handles, keep hips down."
    ],
    "avoid": [
      "Kicking the weight up fast."
    ],
    "alternative": "Goblet squat, 2 × 12-15",
    "machine": "Technogym Leg Extension (stack); avoid the wobbly plate-loaded one if the stack version exists",
    "sources": [
      "R-vol-1"
    ]
  },
  {
    "id": "bulgarian",
    "name": "Bulgarian split squat",
    "fr": "Fentes bulgares",
    "group": "Legs",
    "muscles": "Quads, glutes, balance",
    "equipment": "Flat bench + dumbbells",
    "loadType": "dumbbell",
    "tags": [
      "dumbbell",
      "bench"
    ],
    "where": "both",
    "primary": [
      "quads",
      "glutes"
    ],
    "secondary": [
      "adductors"
    ],
    "how": [
      "Back foot laces-down on a bench, front foot about a big step forward.",
      "Drop straight down until the back knee nearly touches the floor.",
      "Push through the front foot to stand. Do all reps, then switch legs."
    ],
    "cues": [
      "Slight forward lean = more glutes, upright = more quads."
    ],
    "avoid": [
      "Front foot too close so the heel lifts."
    ],
    "alternative": "Reverse lunge with dumbbells",
    "progression": "Start with bodyweight only for the first 1-2 weeks to learn the balance.",
    "machine": "Flat bench + dumbbells",
    "sources": [
      "R-str-8"
    ]
  },
  {
    "id": "calf_stand",
    "name": "Standing calf raise",
    "fr": "Mollets debout (machine)",
    "group": "Legs",
    "muscles": "Calves",
    "equipment": "No standing calf machine at this gym: the leg press sled (calf press) or a Smith machine with toes on a plate",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "calves"
    ],
    "secondary": [],
    "how": [
      "Balls of the feet on the edge, heels hanging.",
      "Lower the heels as far as possible, pause 1-2 s in the stretch.",
      "Rise as high as you can onto your toes."
    ],
    "cues": [
      "The pause at the bottom is the important part."
    ],
    "avoid": [
      "Bouncing."
    ],
    "alternative": "Single-leg calf raise on a step holding a dumbbell",
    "machine": "No standing calf machine reported: use the leg press sled (calf press) or a Smith machine with toes on a plate",
    "sources": [
      "R-gym-3"
    ]
  },
  {
    "id": "calf_seated",
    "name": "Seated calf raise",
    "fr": "Mollets assis",
    "group": "Legs",
    "muscles": "Calves (soleus)",
    "equipment": "Seated calf machine",
    "loadType": "stack",
    "tags": [
      "machine"
    ],
    "where": "gym",
    "primary": [
      "calves"
    ],
    "secondary": [],
    "how": [
      "Knee pad snug on lower thighs, balls of feet on the plate.",
      "Lower heels fully, pause, push up high."
    ],
    "cues": [
      "Slow and full range."
    ],
    "avoid": [
      "Tiny bouncy reps."
    ],
    "alternative": "Calf press on the leg press",
    "machine": "Seated calf machine (not confirmed)",
    "sources": [
      "R-vol-1"
    ]
  },
  {
    "id": "back_ext",
    "name": "45° back extension",
    "fr": "Extensions lombaires 45° (banc à lombaires)",
    "group": "Posture",
    "muscles": "Spinal erectors, glutes, hamstrings, upper back",
    "equipment": "45° hyperextension bench",
    "loadType": "bodyweight",
    "tags": [
      "bench"
    ],
    "where": "gym",
    "primary": [
      "lowerBack",
      "glutes"
    ],
    "secondary": [
      "hamstrings",
      "upperBack"
    ],
    "how": [
      "Pad just below your hip bones, heels against the plate. Hold a weight plate flat against your chest (or cross your arms with no weight).",
      "Bend at the hips and lower your torso as far as feels good.",
      "Come up until your body is in one straight line, then squeeze your upper back (shoulder blades together) for 1 s."
    ],
    "cues": [
      "Don't over-arch past straight.",
      "Add weight with a heavier plate once 15 reps feel easy."
    ],
    "avoid": [
      "Hyper-extending the lower back at the top."
    ],
    "alternative": "Cable pull-through at the low pulley, or Technogym Lower Back machine if present",
    "posture": true,
    "machine": "45° hyperextension bench (reported under repair at times)",
    "sources": [
      "R-post-2"
    ]
  },
  {
    "id": "pallof",
    "name": "Pallof press",
    "fr": "Pallof press (anti-rotation, poulie)",
    "group": "Core",
    "muscles": "Obliques, deep abs (resisting twisting)",
    "equipment": "Cable at chest height, single handle; stand side-on to the machine",
    "loadType": "stack",
    "tags": [
      "cable"
    ],
    "where": "gym",
    "primary": [
      "obliques",
      "abs"
    ],
    "secondary": [],
    "how": [
      "Stand side-on to the pulley, handle at your sternum with both hands. Step away until the cable pulls you sideways.",
      "Brace like someone is about to poke your belly.",
      "Press the handle straight out in front, hold 2 s without letting your body twist, bring it back.",
      "Do all reps, then turn around for the other side."
    ],
    "cues": [
      "The cable comes from your SIDE (drawn behind you here).",
      "Hips and shoulders square, facing forward."
    ],
    "avoid": [
      "Twisting toward the machine."
    ],
    "alternative": "Band Pallof press",
    "machine": "Cable pulley at chest height",
    "sources": [
      "R-core-2"
    ]
  },
  {
    "id": "dead_bug",
    "name": "Dead bug",
    "fr": "Dead bug (au sol)",
    "group": "Core",
    "muscles": "Deep abs, keeps lower back flat",
    "equipment": "Mat (gym or home)",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "abs"
    ],
    "secondary": [],
    "how": [
      "Lie on your back, arms pointing at the ceiling, knees above hips at 90°.",
      "Press your lower back into the floor and keep it there.",
      "Slowly extend one arm overhead and the OPPOSITE leg out straight, hovering above the floor.",
      "Return and switch sides. Breathe out as you extend."
    ],
    "cues": [
      "Slow: 3 s out, 3 s back.",
      "If your back arches, don't go as far."
    ],
    "avoid": [
      "Lower back lifting off the floor."
    ],
    "alternative": "Same at home",
    "machine": "Mat, Abdos-stretch zone",
    "sources": [
      "R-core-1"
    ]
  },
  {
    "id": "cable_crunch",
    "name": "Kneeling cable crunch",
    "fr": "Crunch à la poulie haute",
    "group": "Core",
    "muscles": "Rectus abdominis (six-pack muscles)",
    "equipment": "Cable station, rope, pulley at the top",
    "loadType": "stack",
    "tags": [
      "cable"
    ],
    "where": "gym",
    "primary": [
      "abs"
    ],
    "secondary": [],
    "how": [
      "Kneel facing the pulley, rope ends beside your head.",
      "Hips stay still. Curl your ribcage down toward your pelvis, rounding your back.",
      "Squeeze 1 s, then uncurl slowly."
    ],
    "cues": [
      "Think \"chest to belly button\", not \"hips back\"."
    ],
    "avoid": [
      "Sitting back on your heels so the hips do the work."
    ],
    "alternative": "Crunch on a mat",
    "machine": "Cable pulley, top, rope",
    "sources": [
      "R-core-1"
    ]
  },
  {
    "id": "knee_raise",
    "name": "Hanging knee raise",
    "fr": "Relevés de genoux suspendu (ou chaise romaine)",
    "group": "Core",
    "muscles": "Lower abs, hip flexors, grip",
    "equipment": "Pull-up bar, or the \"captain's chair\" (forearm-supported) station",
    "loadType": "bodyweight",
    "tags": [
      "bodyweight"
    ],
    "where": "gym",
    "primary": [
      "abs"
    ],
    "secondary": [
      "hipFlexors",
      "forearms"
    ],
    "how": [
      "Hang from the bar (or rest forearms on the captain's chair).",
      "Raise your knees up to hip height or higher, rolling your pelvis up at the top.",
      "Lower slowly, no swinging."
    ],
    "cues": [
      "Curl the hips, not just lift the legs."
    ],
    "avoid": [
      "Swinging to build momentum."
    ],
    "alternative": "Lying reverse crunch",
    "machine": "Captain's chair or pull-up bar",
    "sources": [
      "R-core-2"
    ]
  },
  {
    "id": "side_plank",
    "name": "Side plank",
    "fr": "Gainage latéral",
    "group": "Core",
    "muscles": "Obliques, side hip muscles",
    "equipment": "Mat",
    "loadType": "time",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "obliques"
    ],
    "secondary": [
      "glutes"
    ],
    "how": [
      "On your side, elbow under shoulder, legs straight and stacked.",
      "Lift hips so your body forms a straight line.",
      "Hold for the time, then switch sides."
    ],
    "cues": [
      "Push the floor away with the elbow."
    ],
    "avoid": [
      "Hips sagging or piking."
    ],
    "alternative": "Side plank on knees",
    "machine": "Mat",
    "sources": [
      "R-core-2"
    ]
  },
  {
    "id": "farmer",
    "name": "Farmer's carry",
    "fr": "Marche du fermier",
    "group": "Core",
    "muscles": "Grip, traps, whole core, posture",
    "equipment": "Heavy dumbbells or kettlebells",
    "loadType": "distance",
    "tags": [
      "dumbbell"
    ],
    "where": "gym",
    "primary": [
      "forearms",
      "traps"
    ],
    "secondary": [
      "abs",
      "upperBack"
    ],
    "how": [
      "Pick up heavy dumbbells (deadlift them up with a flat back).",
      "Stand tall, shoulders down and back, and walk with short controlled steps.",
      "Walk the distance, put them down carefully."
    ],
    "cues": [
      "Proud chest: it trains good posture under load."
    ],
    "avoid": [
      "Leaning or shrugging."
    ],
    "alternative": "Suitcase carry, one side",
    "posture": true,
    "machine": "Heavy dumbbells or kettlebells",
    "sources": [
      "R-core-1"
    ]
  },
  {
    "id": "cat_cow",
    "name": "Cat-cow",
    "fr": "Chat-vache",
    "group": "Mobility",
    "muscles": "Whole spine",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "lowerBack",
      "upperBack"
    ],
    "secondary": [],
    "how": [
      "On hands and knees.",
      "Breathe in: let the belly drop, look up (cow).",
      "Breathe out: round the back up high, tuck the chin (cat)."
    ],
    "cues": [
      "Move one vertebra at a time, slowly."
    ],
    "avoid": []
  },
  {
    "id": "open_book",
    "name": "Open book",
    "fr": "Livre ouvert (rotation thoracique)",
    "group": "Mobility",
    "muscles": "Upper-back rotation, chest",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "upperBack"
    ],
    "secondary": [
      "chest"
    ],
    "how": [
      "Lie on your side, knees bent at 90° and stacked, arms straight out in front.",
      "Keep the knees together and open the top arm across to the other side, following your hand with your eyes.",
      "Breathe out at the end, then close the book."
    ],
    "cues": [
      "Knees don't move."
    ],
    "avoid": []
  },
  {
    "id": "wall_slide",
    "name": "Wall angel",
    "fr": "Anges au mur",
    "group": "Mobility",
    "muscles": "Lower traps, serratus, shoulder mobility",
    "equipment": "A wall",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "traps",
      "upperBack"
    ],
    "secondary": [],
    "how": [
      "Back, head and bum against the wall, arms in a \"W\" with elbows and wrists touching the wall.",
      "Slide the arms up into a \"Y\" while keeping contact.",
      "Slide back down, squeezing shoulder blades down."
    ],
    "cues": [
      "Ribs down, lower back close to the wall."
    ],
    "avoid": [
      "Arching to cheat the arms up."
    ],
    "posture": true
  },
  {
    "id": "band_pullapart",
    "name": "Band pull-apart",
    "fr": "Écartés élastique",
    "group": "Mobility",
    "muscles": "Rear shoulders, mid back",
    "equipment": "Light elastic band (in the stretching area)",
    "loadType": "none",
    "tags": [
      "band"
    ],
    "where": "both",
    "primary": [
      "rearDelts",
      "upperBack"
    ],
    "secondary": [],
    "how": [
      "Hold a band at shoulder height, arms straight in front.",
      "Pull it apart until it touches your chest, squeezing shoulder blades.",
      "Return slowly."
    ],
    "cues": [
      "Shoulders down."
    ],
    "avoid": [],
    "posture": true
  },
  {
    "id": "chin_tuck",
    "name": "Chin tuck",
    "fr": "Rentrer le menton",
    "group": "Mobility",
    "muscles": "Deep neck flexors (fixes forward head)",
    "equipment": "None",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "neck"
    ],
    "secondary": [],
    "how": [
      "Stand or sit tall.",
      "Glide your head straight back, making a double chin, without tilting up or down.",
      "Hold 3 s, relax."
    ],
    "cues": [
      "Like someone is pulling a string from the back of your head."
    ],
    "avoid": [],
    "posture": true
  },
  {
    "id": "leg_swing",
    "name": "Leg swings",
    "fr": "Balancements de jambe",
    "group": "Mobility",
    "muscles": "Hips, hamstrings, hip flexors",
    "equipment": "Hold onto something",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "hipFlexors",
      "hamstrings"
    ],
    "secondary": [],
    "how": [
      "Hold a rack or wall, stand on one leg.",
      "Swing the free leg forward and back, gradually higher.",
      "10 swings, then switch."
    ],
    "cues": [
      "Relaxed, smooth."
    ],
    "avoid": []
  },
  {
    "id": "pec_door",
    "name": "Doorway chest stretch",
    "fr": "Étirement des pectoraux (encadrement de porte)",
    "group": "Stretch",
    "muscles": "Chest, front shoulders",
    "equipment": "Door frame or rack upright",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "chest"
    ],
    "secondary": [
      "frontDelts"
    ],
    "how": [
      "Forearm on the door frame, elbow at shoulder height.",
      "Step through with the same-side foot until you feel a stretch across the chest.",
      "Hold, breathe, then switch arms."
    ],
    "cues": [
      "Don't let the shoulder roll forward."
    ],
    "avoid": [
      "Pushing into pain."
    ],
    "posture": true
  },
  {
    "id": "child_lat",
    "name": "Child's pose lat stretch",
    "fr": "Posture de l'enfant (grand dorsal)",
    "group": "Stretch",
    "muscles": "Lats, lower back, shoulders",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "lats"
    ],
    "secondary": [
      "lowerBack"
    ],
    "how": [
      "Kneel, sit back on your heels, reach your arms far forward on the floor.",
      "Walk both hands to the right to stretch the left side, then to the left."
    ],
    "cues": [
      "Sink the hips back, chest toward the floor."
    ],
    "avoid": []
  },
  {
    "id": "thoracic_roll",
    "name": "Foam-roller thoracic extension",
    "fr": "Extension thoracique sur rouleau",
    "group": "Stretch",
    "muscles": "Upper back (undoes the slouch)",
    "equipment": "Foam roller",
    "loadType": "none",
    "tags": [
      "foam roller"
    ],
    "where": "both",
    "primary": [
      "upperBack"
    ],
    "secondary": [],
    "how": [
      "Lie with the roller across your upper back (below the shoulder blades), hands supporting your head, hips on the floor.",
      "Let your upper back drape back over the roller, breathe out.",
      "Roll up a few centimetres and repeat. Never on the lower back."
    ],
    "cues": [
      "Keep the ribs down."
    ],
    "avoid": [
      "Rolling on the lower back."
    ],
    "alternative": "Back over a rolled towel at home",
    "posture": true
  },
  {
    "id": "hip_flexor",
    "name": "Kneeling hip-flexor stretch",
    "fr": "Étirement des fléchisseurs de hanche (fente au sol)",
    "group": "Stretch",
    "muscles": "Hip flexors, quads (tight from sitting)",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "hipFlexors"
    ],
    "secondary": [
      "quads"
    ],
    "how": [
      "Half-kneel, back knee on a mat.",
      "Squeeze the glute of the back leg and tuck your pelvis under.",
      "Shift slightly forward until the front of the back hip stretches; reach the same-side arm up."
    ],
    "cues": [
      "Small movement, big glute squeeze."
    ],
    "avoid": [
      "Arching the lower back."
    ],
    "posture": true
  },
  {
    "id": "ham_strap",
    "name": "Lying hamstring stretch",
    "fr": "Étirement des ischio-jambiers allongé (sangle)",
    "group": "Stretch",
    "muscles": "Hamstrings",
    "equipment": "Strap, towel or band",
    "loadType": "none",
    "tags": [
      "strap"
    ],
    "where": "both",
    "primary": [
      "hamstrings"
    ],
    "secondary": [],
    "how": [
      "Lie on your back, strap around one foot, other leg flat on the floor.",
      "Keep the knee straight and pull the leg up until you feel a strong stretch behind the thigh. Hold 30 s.",
      "Contract-relax, 3 rounds: push the heel into the strap at about half effort for 5 s, breathe out, relax and pull a little deeper, hold 25 s.",
      "Switch legs."
    ],
    "cues": [
      "Strong stretch but calm breathing, about 6 out of 10.",
      "Go deeper on the out-breath."
    ],
    "avoid": [
      "Bending the knee to fake range.",
      "Tingling or an electric feeling down the leg: back off at once."
    ],
    "sources": [
      "R-str-2"
    ]
  },
  {
    "id": "glute_fig4",
    "name": "Figure-4 glute stretch",
    "fr": "Étirement fessier en \"4\"",
    "group": "Stretch",
    "muscles": "Glutes, deep hip rotators",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "glutes"
    ],
    "secondary": [],
    "how": [
      "On your back, knees bent. Cross your right ankle over your left knee (makes a \"4\").",
      "Pull the left thigh toward your chest until the right buttock stretches.",
      "Switch sides."
    ],
    "cues": [
      "Push the crossed knee gently away."
    ],
    "avoid": []
  },
  {
    "id": "calf_wall",
    "name": "Wall calf stretch",
    "fr": "Étirement des mollets au mur",
    "group": "Stretch",
    "muscles": "Calves",
    "equipment": "Wall",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "calves"
    ],
    "secondary": [],
    "how": [
      "Hands on the wall, one foot back with the leg straight, heel down.",
      "Lean into the wall until the back calf stretches.",
      "Switch legs."
    ],
    "cues": [
      "Back toes point straight forward."
    ],
    "avoid": [
      "Heel lifting."
    ]
  },
  {
    "id": "neck_side",
    "name": "Upper-trap neck stretch",
    "fr": "Étirement du trapèze supérieur",
    "group": "Stretch",
    "muscles": "Upper traps, side of neck",
    "equipment": "None",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "neck",
      "traps"
    ],
    "secondary": [],
    "how": [
      "Sit tall, hold the seat with your left hand.",
      "Tilt your right ear toward your right shoulder, using the right hand for a very light pull.",
      "Switch sides."
    ],
    "cues": [
      "Gentle; shoulders stay down."
    ],
    "avoid": [
      "Pulling hard."
    ]
  },
  {
    "id": "sl_rdl_bw",
    "name": "Single-leg Romanian deadlift (bodyweight)",
    "fr": "Soulevé de terre roumain sur une jambe (poids du corps)",
    "group": "Mobility",
    "muscles": "Hamstrings, glutes, balance",
    "equipment": "None (hold a rack for balance at first)",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "hamstrings",
      "glutes"
    ],
    "secondary": [
      "lowerBack"
    ],
    "how": [
      "Stand on one leg, knee soft.",
      "Hinge forward at the hip, 3 s down, as the free leg rises straight behind you, back flat.",
      "Stop when you feel the hamstring stretch, then stand back up by squeezing the glute."
    ],
    "cues": [
      "Body and back leg move as one straight plank.",
      "Hips stay square to the floor."
    ],
    "avoid": [
      "Rounding the back to reach lower.",
      "Opening the hip of the lifted leg."
    ],
    "sources": [
      "R-str-8"
    ]
  },
  {
    "id": "bird_dog",
    "name": "Bird-dog",
    "fr": "Bird-dog (chien d'arrêt)",
    "group": "Core",
    "muscles": "Deep abs, back muscles, glutes",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "lowerBack",
      "abs"
    ],
    "secondary": [
      "glutes"
    ],
    "how": [
      "On hands and knees, hands under shoulders, knees under hips.",
      "Slowly reach one arm forward and the OPPOSITE leg back until both are level with your body.",
      "Hold 2 s, come back, switch sides."
    ],
    "cues": [
      "Imagine a glass of water on your lower back: don't spill it.",
      "Reach long rather than high."
    ],
    "avoid": [
      "Hips rotating or the lower back arching."
    ]
  },
  {
    "id": "march",
    "name": "Brisk march or jumping jacks",
    "fr": "Marche rapide sur place ou jumping jacks",
    "group": "Mobility",
    "muscles": "Whole body warm-up",
    "equipment": "None",
    "loadType": "none",
    "tags": [
      "bodyweight"
    ],
    "where": "both",
    "primary": [
      "quads",
      "calves"
    ],
    "secondary": [],
    "how": [
      "March on the spot with high knees, or do easy jumping jacks.",
      "Just enough to feel warm; a warm muscle stretches better."
    ],
    "cues": [
      "Easy pace, not a workout."
    ],
    "avoid": []
  },
  {
    "id": "seated_pike",
    "name": "Seated pike fold",
    "fr": "Pince assise jambes tendues",
    "group": "Stretch",
    "muscles": "Hamstrings, calves, lower back",
    "equipment": "Towel or strap around both feet",
    "loadType": "none",
    "tags": [
      "strap",
      "mat"
    ],
    "where": "both",
    "primary": [
      "hamstrings"
    ],
    "secondary": [
      "calves",
      "lowerBack"
    ],
    "how": [
      "Sit with legs straight together, towel looped around both feet.",
      "Keep your back flat and pull your chest forward by bending at the hips.",
      "On the last round only, let go and relax fully into the fold."
    ],
    "cues": [
      "Chest toward the knees, not the head toward the knees.",
      "Knees straight, toes pointing up."
    ],
    "avoid": [
      "Rounding the back to fake depth."
    ],
    "sources": [
      "R-str-1"
    ]
  },
  {
    "id": "pancake",
    "name": "Pancake straddle lean",
    "fr": "Écart facial assis (pancake)",
    "group": "Stretch",
    "muscles": "Inner thighs, hamstrings",
    "equipment": "Mat",
    "loadType": "none",
    "tags": [
      "mat"
    ],
    "where": "both",
    "primary": [
      "adductors",
      "hamstrings"
    ],
    "secondary": [],
    "how": [
      "Sit with legs wide apart, knees pointing up.",
      "Tilt your pelvis forward and lean your chest forward, back flat.",
      "Lean to the centre, then over the right leg, then over the left leg."
    ],
    "cues": [
      "Chest proud, move from the hips."
    ],
    "avoid": [
      "Knees rolling inward."
    ],
    "sources": [
      "R-str-1"
    ]
  }
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
