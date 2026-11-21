// "Why" cards for the Learn tab: short, plain English, each with its sources (ids in src/data/sources.ts).
// Summarised from research/RESEARCH.md and research/PROGRAM.md. Strength of evidence is said in words.

export interface LearnCard { id: string; title: string; body: string[]; sources: string[]; evidence: "strong" | "moderate" | "expert opinion" | "weak" }

export const LEARN: LearnCard[] = [
  {
    id: "split", title: "Why upper / lower in a rotation", evidence: "strong",
    body: [
      "Training each muscle about twice a week builds more muscle than once a week. Going to three times adds little when the total work is the same.",
      "Split or full-body makes no real difference when the total is equal, so the split was picked for your timetable: four sessions in a fixed order A, B, C, D, done on whatever days you go.",
      "Missed a day? Do the next letter. Never skip one. Try not to do more than three gym days in a row, and keep at least one full rest day a week.",
    ],
    sources: ["R-freq-1", "R-freq-2", "R-split-1", "R-vol-1"],
  },
  {
    id: "volume", title: "How many sets", evidence: "strong",
    body: [
      "More hard sets per muscle per week give more growth, but each extra set adds less than the one before. Around 10 to 12 hard sets per muscle per week gets most of the benefit for a beginner.",
      "You start with 2 sets of everything for two weeks while you learn the movements, then move to the full program.",
    ],
    sources: ["R-vol-1", "R-vol-2", "R-beg-1"],
  },
  {
    id: "reps", title: "Reps, and how heavy", evidence: "strong",
    body: [
      "Anywhere from about 6 to 30 reps builds similar muscle, as long as the set is hard. Heavier weights (fewer reps) are better for maximum strength.",
      "So big exercises use 6 to 12 reps and small ones 10 to 20: strength and size from the first, joint-friendly volume from the second.",
    ],
    sources: ["R-load-1", "R-load-2"],
  },
  {
    id: "rir", title: "How close to failure (reps in reserve)", evidence: "moderate",
    body: [
      "Sets that end closer to failure build more muscle; strength cares less. Going all the way to failure adds fatigue for little extra.",
      "Stop big lifts with 1 or 2 good reps left. On the last set of a small exercise (curls, raises) you can go to 0 or 1 left. Never grind with bad form.",
    ],
    sources: ["R-fail-1", "R-fail-2"],
  },
  {
    id: "progress", title: "How the app makes you progress", evidence: "moderate",
    body: [
      "Double progression: stay on a weight until every set reaches the top of the rep range with good form. Next time, add the smallest step and build the reps back up.",
      "If you fall below the range two sessions in a row, the app drops the weight by about 10 %. On the assisted pull-up, progress means less help (a lower number).",
      "Every 8 to 10 weeks, or when several lifts stall, take an easy week with half the sets (a deload). Research on deloads is thin: this is expert practice.",
    ],
    sources: ["R-prog-1", "R-beg-1", "R-prog-2"],
  },
  {
    id: "rest", title: "Rest between sets", evidence: "moderate",
    body: [
      "Resting longer than about 90 seconds gives no extra growth on average, so big lifts rest 2 minutes and small ones 60 to 90 seconds.",
      "Supersets (two exercises for different muscles back to back) save time with no loss of gains.",
    ],
    sources: ["R-rest-1", "R-rest-2", "R-ss-1"],
  },
  {
    id: "posture", title: "Fixing rounded shoulders", evidence: "moderate",
    body: [
      "Strengthening the upper back is what improves head, shoulder and upper-back angles. Stretching on its own doesn't fix posture.",
      "So every upper day has rows, pulls and face pulls, with about twice as many pulling sets as pushing sets. Expect visible change in about 2 to 3 months.",
      "How you sit all day is a habit: the gym makes good posture easier to hold, it doesn't replace it. Every 30 to 45 minutes at your desk: 5 chin tucks and 5 shoulder-blade squeezes.",
    ],
    sources: ["R-post-1", "R-post-3", "R-post-2"],
  },
  {
    id: "core", title: "Core: gym or mat?", evidence: "moderate",
    body: [
      "Both work. What matters is training the trunk to resist movement (Pallof press, dead bug, side plank, carries) plus some loaded crunching (cable crunch, knee raises).",
      "The gym's advantage is that cables let you add weight over time. Squats, deadlifts and carries also train the core, so no extra ab sessions at home are needed.",
    ],
    sources: ["R-core-1", "R-core-2"],
  },
  {
    id: "cardio", title: "Cardio and your cycling", evidence: "moderate",
    body: [
      "Cardio doesn't hurt muscle or strength gains overall. Running interferes a little more than cycling, so your bike rides are ideal.",
      "Aim for 150 minutes or more a week of easy to moderate cardio in total (your cycling counts). On gym days, do it after the weights.",
    ],
    sources: ["R-cardio-1", "R-cardio-2", "R-cardio-3"],
  },
  {
    id: "stretch", title: "Getting more flexible", evidence: "moderate",
    body: [
      "Flexibility gains depend on the total time you stretch each muscle per week; how many days you split it over matters less. Holds and contract-relax stretching beat swinging movements.",
      "Stretch at about 6 out of 10: a strong pull with calm breathing. Pain doesn't add progress. People who start stiff improve the most.",
      "Rough timeline (weak evidence): toes in 6 to 8 weeks, holding your feet in 4 to 6 months, chest to knees in 18 to 24 months. Full-range lifting helps too.",
    ],
    sources: ["R-str-1", "R-str-2", "R-str-4"],
  },
  {
    id: "food", title: "Food basics (not medical advice)", evidence: "moderate",
    body: [
      "Protein: 1.6 to 2.2 g per kg of body weight a day, spread over 3 or 4 meals. Eat a small surplus and gain about 0.25 to 0.5 % of your body weight a week.",
      "Creatine monohydrate, 3 to 5 g a day, is optional and well studied. Sleep 7 to 9 hours.",
    ],
    sources: ["R-nut-1", "R-nut-2", "R-nut-4"],
  },
  {
    id: "safety", title: "Staying safe", evidence: "expert opinion",
    body: [
      "Warm up, then do two lighter ramp-up sets on the first exercise. Brace on big lifts: breathe in, tighten your belly as if someone will poke it, then lift.",
      "Stop at once for sharp pain, numbness, tingling or an electric feeling down a limb. See a physio or doctor if a pain lasts more than a week or two.",
      "Ask a Fitness Park coach (reception 9:00 to 21:00) to set the seat on the leg press, chest press and back extension the first time.",
    ],
    sources: ["R-safe-1", "R-safe-3", "R-safe-5", "R-gym-1"],
  },
  {
    id: "gym", title: "Your gym", evidence: "weak",
    body: [
      "Fitness Park Lille \"Le 31\" is open 6:00 to 23:00 every day. Members say it's packed around 18:00 and quiet early: before 12:00 or after 20:30 is best.",
      "Reviews mention no standing calf machine and a back-extension bench that has been out of order, so every exercise has a backup. Bring your own clip for the cables.",
    ],
    sources: ["R-gym-1", "R-gym-3"],
  },
];

export const GLOSSARY: [string, string][] = [
  ["Rep", "One full movement, down and up."],
  ["Set", "A group of reps done without stopping."],
  ["Working set", "A hard set that counts toward progress (not a warm-up)."],
  ["Warm-up set (W)", "A light set before the working sets, to prepare the joints. Not counted in progress."],
  ["RIR (reps in reserve)", "How many more good reps you could still have done when you stopped."],
  ["Failure", "The point where you can't do another rep with good form."],
  ["Superset", "Two exercises done back to back, resting after the pair."],
  ["Drop set (D)", "A lighter set done straight after a working set."],
  ["Double progression", "Add reps until you hit the top of the range on every set, then add weight."],
  ["Deload", "An easy week with half the sets, to recover."],
  ["1RM", "One-rep max: the most you could lift once. The app estimates it; never test it."],
  ["Compound exercise", "Uses several joints at once (row, press, squat)."],
  ["Isolation exercise", "Uses mainly one joint (curl, lateral raise)."],
  ["Hinge", "Bending at the hips with a flat back, hips pushing back (RDL, back extension)."],
  ["Brace", "Tightening your belly and holding your breath briefly to protect your spine on heavy lifts."],
  ["ROM (range of motion)", "How far a joint moves. Use the full range."],
  ["Eccentric", "The lowering part of a rep. Do it slowly, in 2 to 3 seconds."],
  ["PNF stretching", "Contract-relax: push against the stretch for a few seconds, relax, then go a little deeper."],
  ["Posterior chain", "The back of the body: hamstrings, glutes, back."],
  ["Plate-loaded", "A machine you load with weight plates, instead of a pin in a stack."],
  ["Stack", "The column of weights on a machine; you pick the weight with a pin."],
];
