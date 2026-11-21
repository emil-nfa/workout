# Program (final recommendation after M0)

For the user (beginner, young adult, no injuries), Fitness Park Lille "Le 31", 4-5 gym days a week, 45-60 min. Citation ids point to `RESEARCH.md`. Exercise ids are v1 ids where they exist; new ids are marked **(new)**. General fitness information, not medical advice.

## 1. Structure

- **Rotation** A → B → C → D, then back to A; optional **E** on a 5th day. If he misses a day he does the next letter; no letter is skipped. [R-split-1, R-freq-2]
- Max 3 gym days in a row before a rest day is ideal, never 4; at least 1 full rest day per week (expert opinion).
- Example weeks: 4 days = Mon A, Tue B, Wed C, Sat D. 5 days = Mon A, Tue B, Wed C, Fri D, Sat E.
- Each muscle about 2×/week. [R-freq-1, R-freq-2, R-vol-1]
- Rest: big lifts 2 min, small lifts 60-90 s. [R-rest-1, R-rest-2]
- One-sided moves: left side, right side, then rest.
- Supersets: do set 1 of the first move, ~15 s to switch, set 1 of the second, then rest. Only opposing or unrelated muscles, stations close together. [R-ss-1]

## 2. Machines at the gym

Confirmed kit at the club [R-gym-1]: 9 benches (flat, incline, decline), dumbbells 4-50 kg, kettlebells 4-24 kg, 3 squat cages (free and guided = Smith), 2 facing cable pulleys, Technogym + Hammer Strength + Gym80 + Eleiko strength machines, bikes and rowers. **Exact Technogym lines and Hammer models are not confirmed** [Q11 in RESEARCH.md]: the "likely machine" column uses the usual name-plate names; the user should photograph the plates so the app can use the exact names. Reviews say: no standing calf machine, back extension bench possibly out of order, plate-loaded leg extension wobbly, carabiners often missing [R-gym-3].

## 3. Sessions

Columns: rest is after each set (or after each superset round). RIR = reps in reserve (how many more reps you could have done).

### A: Upper 1 (about 56 min)

| # | Exercise id | Exercise | French name | Likely machine | Fallback | Sets × reps | Rest | Superset | Sources |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `row_chest` | Chest-supported row | Rowing assis buste appuyé | Hammer Strength Iso-Lateral Low Row / Row (plate-loaded) or Technogym Low Row (stack) | Chest-supported dumbbell row on an incline bench | 3 × 8-12 | 2 min | | R-post-3, R-vol-1 |
| 2 | `chest_press` | Machine chest press | Développé assis à la machine (Chest Press) | Technogym Chest Press (stack) or Hammer Iso-Lateral Chest Press | Dumbbell bench press, flat bench | 3 × 6-10 | 2 min | | R-load-2 |
| 3 | `lat_pulldown` | Lat pulldown | Tirage vertical (Lat Machine) | Technogym Lat Machine / Pulldown or Hammer Iso-Lateral Front Pulldown | Kneeling one-arm pulldown at the cable pulley | 3 × 8-12 | 2 min | | R-rom-2 |
| 4 | `db_shoulder` | Seated dumbbell shoulder press | Développé militaire haltères assis | Adjustable bench almost upright + dumbbells | Technogym Shoulder Press (stack) | 2 × 8-12 | 2 min | | R-load-1 |
| 5 | `face_pull` | Face pull (rope) | Face pull poulie haute (corde) | Facing cable pulleys, pulley at forehead height | Band pull-apart, 3 × 15-20 | 3 × 12-20 | 60 s | | R-post-1, R-post-3 |
| 6a | `db_curl` | Dumbbell curl | Curl haltères | Dumbbells | Cable curl | 2 × 10-15 | | SS-A with 6b | R-vol-1 |
| 6b | `pushdown` | Triceps rope pushdown | Extension triceps poulie haute (corde) | Cable pulley, top | Bench dip (feet on floor) | 2 × 10-15 | 60 s after the pair | SS-A | R-ss-1 |

### B: Lower 1 (about 55 min)

| # | Exercise id | Exercise | French name | Likely machine | Fallback | Sets × reps | Rest | Superset | Sources |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `leg_press` | Leg press | Presse à cuisses (inclinée 45°) | Hammer Strength or Gym80 45° plate-loaded leg press, or Technogym Leg Press (stack) | Smith-machine squat in a guided cage | 3 × 8-12 | 2 min | | R-load-1 |
| 2 | `rdl` | Romanian deadlift, dumbbells | Soulevé de terre roumain haltères | Dumbbells | Barbell RDL in a cage | 3 × 8-12 | 2 min | | R-str-8, R-fail-1 |
| 3 | `leg_curl_seated` | Seated leg curl | Leg curl assis | Technogym Leg Curl (stack) | Lying leg curl | 3 × 10-15 | 90 s | | R-vol-1 |
| 4 | `leg_ext` | Leg extension | Leg extension | Technogym Leg Extension (stack); avoid the wobbly plate-loaded one if the stack version exists | Goblet squat, 2 × 12-15 | 2 × 10-15 | 90 s | | R-vol-1 |
| 5 | `calf_stand` | Standing calf raise | Mollets debout | No standing calf machine reported: use the leg press sled (calf press) or a Smith machine with toes on a plate | Single-leg calf raise on a step holding a dumbbell | 3 × 8-15 | 60 s | | R-gym-3 |
| 6a | `pallof` | Pallof press | Pallof press (anti-rotation, poulie) | Cable pulley at chest height | Band Pallof press | 2 × 10/side | | SS-B with 6b | R-core-2 |
| 6b | `dead_bug` | Dead bug | Dead bug (au sol) | Mat, Abdos-stretch zone | Same at home | 2 × 8/side | 60 s after the pair | SS-B | R-core-1 |

### C: Upper 2 (about 56 min)

| # | Exercise id | Exercise | French name | Likely machine | Fallback | Sets × reps | Rest | Superset | Sources |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `assisted_pullup` | Assisted pull-up | Tractions assistées | Assisted chin/dip machine (Technogym or similar), knee pad | Lat pulldown, neutral (palms facing) grip | 3 × 6-10 | 2 min | | R-load-2 |
| 2 | `incline_db` | Incline dumbbell press (30°) | Développé incliné haltères | Incline bench + dumbbells | Technogym Incline Press or Hammer Iso-Lateral Incline Press | 3 × 8-12 | 2 min | | R-load-1 |
| 3 | `db_row` | One-arm dumbbell row | Rowing haltère un bras | Flat bench + dumbbell | Hammer Iso-Lateral Row, one arm at a time | 3 × 8-12/side | 75 s after both sides | | R-post-3 |
| 4 | `reverse_pec` | Reverse pec deck | Oiseau à la machine (Rear Delt) | Technogym Pectoral / Rear Delt machine, facing the pad | Cable reverse fly on the facing pulleys | 3 × 12-20 | 60 s | | R-post-1 |
| 5 | `lateral_raise` | Dumbbell lateral raise | Élévations latérales haltères | Dumbbells (the lateral raise machine was reported broken at times) | Cable lateral raise, low pulley | 3 × 12-20 | 60 s | | R-load-1 |
| 6a | `hammer_curl` | Hammer curl | Curl marteau | Dumbbells | Rope cable curl | 2 × 10-15 | | SS-C with 6b | R-vol-1 |
| 6b | `oh_triceps` | Overhead cable triceps extension | Extension triceps au-dessus de la tête (poulie) | Cable pulley at head height, rope | One dumbbell overhead extension, seated | 2 × 10-15 | 60 s after the pair | SS-C | R-ss-1 |

### D: Lower 2 (about 50 min)

| # | Exercise id | Exercise | French name | Likely machine | Fallback | Sets × reps | Rest | Superset | Sources |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `goblet_squat` | Goblet squat (later: Smith or hack squat) | Squat goblet (haltère) | Dumbbell or kettlebell | Leg press | 3 × 8-12 | 2 min | | R-load-1 |
| 2 | `back_ext` | 45° back extension | Extensions lombaires 45° (banc à lombaires) | 45° hyperextension bench (reported under repair at times) | Cable pull-through at the low pulley, or Technogym Lower Back machine if present | 3 × 10-15 | 90 s | | R-post-2 |
| 3 | `bulgarian` | Bulgarian split squat | Fentes bulgares | Flat bench + dumbbells | Reverse lunge with dumbbells | 2 × 8-12/leg | 90 s after both legs | | R-str-8 |
| 4 | `leg_curl_lying` | Lying leg curl | Leg curl allongé | Lying leg curl machine | Seated leg curl | 3 × 10-15 | 90 s | | R-vol-1 |
| 5a | `calf_seated` | Seated calf raise | Mollets assis | Seated calf machine (not confirmed) | Calf press on the leg press | 3 × 12-20 | | SS-D with 5b | R-vol-1 |
| 5b | `cable_crunch` | Kneeling cable crunch | Crunch à la poulie haute | Cable pulley, top, rope | Crunch on a mat | 3 × 10-15 | 60 s after the pair | SS-D | R-core-1 |

### E: Bonus, optional (about 49 min)

| # | Exercise id | Exercise | French name | Likely machine | Fallback | Sets × reps | Rest | Superset | Sources |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `cable_row` | Seated cable row, wide grip, elbows out | Tirage horizontal poulie basse | Low cable row station (Technogym Low Row or cable) | Chest-supported row | 3 × 10-15 | 90 s | | R-post-3 |
| 2a | `face_pull` | Face pull | Face pull poulie haute | Cable pulley | Band pull-apart | 2 × 15-20 | | SS-E1 with 2b | R-post-1 |
| 2b | `pushup` | Push-up | Pompes | Floor | Knee push-up | 2 × stop 2 reps before failure | 75 s after the pair | SS-E1 | R-ss-1 |
| 3 | `lateral_raise` | Dumbbell lateral raise | Élévations latérales haltères | Dumbbells | Cable lateral raise | 2 × 15-20 | 60 s | | R-load-1 |
| 4a | `db_curl` | Dumbbell curl | Curl haltères | Dumbbells | Cable curl | 2 × 10-15 | | SS-E2 with 4b | R-vol-1 |
| 4b | `pushdown` | Rope pushdown | Extension triceps poulie haute | Cable pulley | Bench dip | 2 × 10-15 | 60 s after the pair | SS-E2 | R-ss-1 |
| 5 | `farmer` | Farmer's carry | Marche du fermier | Heavy dumbbells or kettlebells | Suitcase carry, one side | 3 × 30-40 m | 90 s | | R-core-1 |
| 6a | `knee_raise` | Hanging knee raise / captain's chair | Relevés de genoux (chaise romaine) | Captain's chair or pull-up bar | Lying reverse crunch | 2 × 8-15 | | SS-E3 with 6b | R-core-2 |
| 6b | `side_plank` | Side plank | Gainage latéral | Mat | Side plank on knees | 2 × 20-40 s/side | 60 s after the pair | SS-E3 | R-core-2 |

## 4. Minutes per session

Model [Q4 in RESEARCH.md]: working set 45 s (two sides 90 s), rest as listed, 15 s to switch inside a superset, 1 min to change exercise, general warm-up 7 min, ramp-up sets 3 min (2 min on E).

| Session | Warm-up + ramp | Working sets + rests | Changes | **Total (weeks 3+)** | Weeks 1-2 (2 sets each) |
|---|---|---|---|---|---|
| A Upper 1 | 10 | 41 | 5 | **56** | 46 |
| B Lower 1 | 10 | 39.5 | 5 | **55** | 45 |
| C Upper 2 | 10 | 41 | 5 | **56** | 44 |
| D Lower 2 | 10 | 36 | 4 | **50** | 40 |
| E Bonus | 9 | 34.5 | 5 | **49** | 41 |

If a session runs long (crowded gym), cut in this order: the last set of each isolation move, then the arm superset. Never cut the first two exercises.

## 5. Weekly hard sets per muscle (4-day week, weeks 3+)

Fractional counting: direct set = 1, indirect = 0.5 [R-vol-1].

| Muscle | Direct sets | + indirect (×0.5) | Fractional total | With E |
|---|---|---|---|---|
| Lats / mid back | 12 (row, pulldown, pull-up, DB row) | | 12 | 15 |
| Rear delts / mid-lower traps | 6 (face pull, reverse pec) | 12 rows → +6 | 12 | 15 |
| Chest | 6 | shoulder press 2 → +1 | 7 | 9 |
| Front delts | 2 | presses 6 → +3 | 5 | 6 |
| Side delts | 3 | shoulder press 2 → +1 | 4 | 6 |
| Biceps | 4 | rows/pulls 12 → +6 | 10 | 13.5 |
| Triceps | 4 | presses 8 → +4 | 8 | 11 |
| Quads | 10 (leg press, leg ext, goblet, split squat) | | 10 | 10 |
| Hamstrings | 9 (RDL, 2 leg curls) | back ext 3 → +1.5 | 10.5 | 10.5 |
| Glutes | 3 (back ext) | leg press, RDL, goblet, split squat 11 → +5.5 | 8.5 | 8.5 |
| Calves | 6 | | 6 | 6 |
| Abs / core | 7 (Pallof, dead bug, cable crunch) | squats, RDL | 7 | 14 |

Pull : push direct sets = 18 : 8 (over 2 : 1, expert-opinion rule for posture) [R-post-1]. Chest, shoulders and arms sit lower than back and legs on purpose: posture is a stated goal and sessions must stay under 60 min. Diminishing returns mean these still give most of the possible gain for a beginner [R-vol-1, R-load-2]. No muscle exceeds about 11 fractional sets in one session [R-vol-2].

## 6. Warm-ups (about 7 min + ramp-up sets)

**Upper days (A, C, E)**
1. Easy bike or rower, 4 min (can talk easily).
2. Band pull-apart × 15 (`band_pullapart`).
3. Wall angel × 8, slow, back of wrists and elbows touching the wall (`wall_slide`, renamed "Wall angel"; same move as July's wall angels).
4. Chin tuck × 10, 3 s hold (`chin_tuck`).
5. Ramp-up on exercise 1: 8 reps at about 50% of the working weight, then 4 reps at about 75%. [R-safe-3]

**Lower days (B, D)**
1. Easy bike, 4 min.
2. Leg swings × 10 per leg, front-back (`leg_swing`).
3. Bodyweight single-leg Romanian deadlift × 6 per leg, 3 s down (`sl_rdl_bw` **(new)**, from July).
4. Bird-dog × 6 per side, slow (`bird_dog` **(new)**, from July).
5. Bodyweight squat × 10 with a 2 s pause at the bottom.
6. Ramp-up on exercise 1 as above. [R-safe-3]

**July "strength extras" decision**
| July move | Decision | Why |
|---|---|---|
| Prone Y-T-W | **Dropped** | Face pulls and the reverse pec deck train the same muscles with load you can track [R-post-1, R-post-3]. |
| Wall angels | **Kept, upper warm-up** (replaces v1's wall slide) | Same move, 1 min, good shoulder warm-up. |
| Single-leg RDL, bodyweight | **Kept, lower warm-up** | Hinge practice and loaded hamstring lengthening helps the pike goal [R-str-8]; the loaded version is the dumbbell RDL in B. |
| Bird-dog | **Kept, lower warm-up** | Cheap trunk warm-up before squats and RDLs (expert opinion). |
| Dead bug | **Kept, in session B** | Already a core exercise in the program. |
| Chin tucks anytime | **Kept** in the upper warm-up, morning routine and desk breaks | [R-post-3] |

## 7. Effort, progression, ramp-in, deload

- **How hard.** Big lifts end with 1-2 reps left (RIR 1-2). Small lifts: last set may go to 0-1 RIR. Never grind with bad form. [R-fail-1, R-fail-2]
- **Ramp-in (beginner start).**
  - Weeks 1-2: **2 sets** of every exercise, about **3 RIR**, learn the movement, find starting weights. [R-beg-1, R-vol-4]
  - Weeks 3-4: full sets, **2 RIR**.
  - Week 5 onwards: full sets, 1-2 RIR (isolation last set 0-1).
- **Double progression** (the app's engine) [R-beg-1, R-prog-1]:
  - Stay on a weight until **every set reaches the top of the rep range** with good form → next session add the smallest step (next pin, +2.5 kg on plate machines, next dumbbell; about 2-10%).
  - Reps in range but not at the top → same weight, try to add reps.
  - **Below the bottom of the range two sessions in a row** → drop the weight about 5-10% and build back up.
  - Assisted pull-up: progress by **reducing the assistance** (lower number = harder).
  - Time-based (planks): add 5 s per set when all sets hit the top. Carries: add distance, then weight.
- **Deload** (expert opinion, research on deloading is thin [R-prog-2]): every **8-10 weeks**, or earlier if performance drops on several lifts for 2 sessions in a row, or after illness or exams: one week with **half the sets**, same weights, RIR 3. Not needed before week 8 for a beginner.
- **Coach set-up.** Ask the Fitness Park coach (reception 9:00-21:00) to set seat positions on leg press, chest press and back extension the first time [R-gym-1].

## 8. Cardio, lifestyle (summary)

- 150+ min/week easy-to-moderate cardio in total, his cycling counts; cardio on gym days goes **after** weights [R-cardio-1, R-cardio-3, R-cardio-5]. HIIT optional later [R-cardio-4].
- Protein 1.6-2.2 g/kg/day, small surplus, creatine 3-5 g/day optional, sleep 7-9 h. Not medical advice. [R-nut-1 to R-nut-5]
- Desk breaks every 30-45 min: 5 chin tucks + 5 shoulder-blade squeezes (expert opinion) [R-post-3].
- Best gym times: before 12:00 or after 20:30; avoid about 17:30-20:00 (weak, reviews) [R-gym-3].

## 9. Stretch routines (separate from the gym)

Rules for all routines [R-str-1, R-str-2, R-safe-5]: strong stretch but calm breathing (about 6/10), never pain; go deeper on the out-breath; stop at once for tingling, numbness or an electric feeling down the leg (nerve, not muscle). Never miss twice in a row.

### Morning, dynamic, about 6 min (optional, habit and posture cue)

Dynamic stretching gives the smallest long-term range gains [R-str-2]; this routine is for feeling loose and the posture habit, not the main flexibility work.

| Order | Move (id) | Dose | Sides | Time |
|---|---|---|---|---|
| 1 | Cat-cow (`cat_cow`) | 8 slow reps | | 0:45 |
| 2 | Open book (`open_book`) | 6 reps | per side | 1:00 |
| 3 | Half-kneeling hip-flexor rocks (`hip_flexor`, dynamic) | 8 rocks | per side | 1:00 |
| 4 | Leg swings (`leg_swing`) | 10 swings | per leg | 1:00 |
| 5 | Wall angels (`wall_slide`) | 8 slow reps | | 0:45 |
| 6 | Chin tucks (`chin_tuck`) | 10 reps, 3 s hold | | 0:45 |
| | | | **Total** | **≈ 5:15 + switches ≈ 6 min** |

### Evening, static + PNF, about 18 min (the main flexibility routine, 5-7 evenings a week)

Built from the July protocol, kept where the evidence supports it. Hamstrings get well over the ~10 min/week plateau on purpose: his baseline is poor (bigger response) and longer daily doses still produced gains in the Warneke studies [R-str-1, R-str-4].

| Order | Move (id) | How | Sides | Time | Sources |
|---|---|---|---|---|---|
| 1 | Warm-up: brisk march or jumping jacks, then leg swings (`leg_swing`) | 30 s + 30 s | | 1:00 | R-safe-2 |
| 2 | **Supine hamstring PNF with strap** (`ham_strap`, PNF mode) | Leg up, knee straight, strap on the sole. **Passive hold 30 s**, then 3 rounds of: **contract** (push the heel into the strap at ~50% effort) **5 s** → breathe out, **relax and pull deeper**, **hold 25 s** | per leg | 4:00 (2:00/leg) | R-str-2 |
| 3 | Seated pike, hinge focus (`seated_pike` **(new)**) | Legs straight, towel around both feet, chest forward with a flat back. 2 × 45 s, 15 s rest; last rep relax fully | | 1:45 | R-str-1 |
| 4 | Pancake straddle lean (`pancake` **(new)**) | Legs wide, tilt the pelvis forward: 30 s centre, 30 s over each leg | centre, left, right | 1:30 | R-str-1 |
| 5 | Kneeling hip-flexor stretch (`hip_flexor`) | Back knee down, squeeze that glute, tuck the pelvis | per side | 1:30 (45 s/side) | R-str-1 |
| 6 | Figure-4 glute stretch, lying (`glute_fig4`) | Ankle over the opposite knee, pull the thigh in | per side | 1:30 (45 s/side) | R-str-1 |
| 7 | Wall calf stretch (`calf_wall`) | Back heel down, knee straight 30 s then bent 15 s | per side | 1:30 (45 s/side) | R-str-4 |
| 8 | Child's pose lat stretch (`child_lat`) | 20 s centre, 20 s walked right, 20 s walked left | centre, right, left | 1:00 | R-str-1 |
| 9 | Doorway chest stretch (`pec_door`) | Forearm on the frame, elbow at shoulder height, step through. For shoulder comfort, **not** a posture fix | per side | 1:30 (45 s/side) | R-str-6 |
| 10 | Thoracic extension over a rolled towel or foam roller (`thoracic_roll`) | Towel across the mid-back, arms overhead, slow breaths | | 1:00 | R-post-1 |
| | | | | **≈ 16:15 + switches ≈ 18 min** | |

Dropped from July: elephant walks (dynamic, weaker effect, replaced by the PNF + pike volume) and the butterfly (adductors are covered by the pancake). Dropped from v1 evening: nothing; v1's chest and lat stretches are kept but no longer sold as posture fixes [R-str-6].

### 5-minute fallback (exhausted days)

| Order | Move | How | Time |
|---|---|---|---|
| 1 | Supine hamstring PNF (`ham_strap`) | Same as evening step 2 | 4:00 (2:00/leg) |
| 2 | Seated pike (`seated_pike`) | One 60 s hold, relaxed | 1:00 |

Same as the July fallback: it alone keeps the hamstrings near the weekly plateau dose [R-str-1, R-str-3].

### Measuring progress

On the 1st of each month, same evening slot, after the warm-up: seated pike, legs straight, fingertip-to-toe distance in cm (negative = short of the toes) + one side photo. Posture side photo every 4 weeks. Timeline estimates (weak evidence): toes in about 6-8 weeks, holding the feet in 4-6 months, chest to knees in 18-24 months [Q7 in RESEARCH.md].

## 10. New ids for the app's data files

`sl_rdl_bw` (bodyweight single-leg RDL), `bird_dog`, `seated_pike`, `pancake`. `wall_slide` is renamed "Wall angel" in English, French name "Anges au mur". `knee_raise` moves from D to E. `ham_strap` gains a PNF mode (5 s contract / 25 s hold × 3 after a 30 s passive hold).
