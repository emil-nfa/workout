// First launch: install first, a few questions, the rotation explained in one screen, the disclaimer.
import { useState } from "react";
import { db } from "../db/db";
import { updateSettings } from "../db/settings";
import { useApp } from "../state";
import { isStandalone } from "../lib/platform";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Onboarding() {
  const { settings } = useApp();
  const [step, setStep] = useState(isStandalone() ? 1 : 0);
  const [bw, setBw] = useState(settings.bodyweightKg ? String(settings.bodyweightKg) : "");
  const [exp, setExp] = useState(settings.experience);
  const [days, setDays] = useState<number[]>(settings.trainingDays);
  const [injuries, setInjuries] = useState(settings.injuries ?? "");

  const finish = async () => {
    const kg = Number(bw.replace(",", "."));
    await updateSettings({ bodyweightKg: kg > 30 && kg < 250 ? kg : undefined, experience: exp, trainingDays: days, injuries: injuries.trim() || undefined, onboarded: true });
    if (kg > 30 && kg < 250) await db.bodyweight.put({ id: `bw-${new Date().toISOString().slice(0, 10)}`, date: new Date().toISOString().slice(0, 10), kg });
  };

  const wrap = (children: React.ReactNode, next?: { label: string; on: () => void }) => (
    <div className="screen" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: "calc(var(--safe-b) + var(--s4))" }}>
      <p className="caps muted">Step {step + 1} of 4</p>
      <div style={{ flex: 1 }}>{children}</div>
      {next && <button className="btn primary big" onClick={next.on}>{next.label}</button>}
    </div>
  );

  if (step === 0)
    return wrap(
      <>
        <h1>Install it first</h1>
        <p className="lede">Your log lives only on this phone, and the Safari tab keeps separate data from the installed app. So install before logging anything.</p>
        <ol>
          <li>Tap <b>Share</b> at the bottom of Safari.</li>
          <li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
          <li>Open the app from its new icon and finish setting up there.</li>
        </ol>
        <p className="muted">Open it once with signal: it then works in the basement with no connection.</p>
        <button className="btn link" onClick={() => setStep(1)}>Continue in the browser anyway</button>
      </>,
    );

  if (step === 1)
    return wrap(
      <>
        <h1>About you</h1>
        <div className="stack">
          <div className="field"><label htmlFor="bw">Body weight, kg (optional)</label><input id="bw" inputMode="decimal" value={bw} onChange={(e) => setBw(e.target.value)} placeholder="Used for protein and progress only" /></div>
          <div className="field"><span>Lifting experience</span>
            <div className="seg" role="group" aria-label="Experience">
              {([["new", "New"], ["some", "A bit"], ["regular", "Regular"]] as const).map(([v, l]) => <button key={v} aria-pressed={exp === v} onClick={() => setExp(v)}>{l}</button>)}
            </div>
            <span className="muted" style={{ fontSize: "0.85rem" }}>New or a bit: your first 8 sessions are lighter (2 sets, about 3 reps left) while you learn the movements.</span>
          </div>
          <div className="field"><label htmlFor="inj">Any pain or injury? (optional)</label><input id="inj" value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder="e.g. none" /></div>
        </div>
      </>,
      { label: "Next", on: () => setStep(2) },
    );

  if (step === 2)
    return wrap(
      <>
        <h1>Your week</h1>
        <p className="lede">Which days do you usually train? It only helps the app suggest; you can go any day.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {DAYS.map((d, i) => <button key={d} className="btn" aria-pressed={days.includes(i)} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort())} style={{ padding: 0, ...(days.includes(i) ? { background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" } : {}) }}>{d}</button>)}
        </div>
        <h2>How the rotation works</h2>
        <div className="panel">
          <p style={{ marginTop: 0, font: "700 2rem/1 var(--font-num)" }}>A → B → C → D → A…</p>
          <p>Four sessions in a fixed order: upper, lower, upper, lower. Each muscle gets trained about twice a week.</p>
          <p>Go whenever you can. Each time, do <b>the next letter</b>. Missed a day? Nothing to catch up: just do the next letter. Never skip one.</p>
          <p style={{ marginBottom: 0 }}>Got a fifth day? <b>E</b> is an optional bonus for posture, arms and carries. Try not to train more than 3 days in a row.</p>
        </div>
      </>,
      { label: "Next", on: () => setStep(3) },
    );

  return wrap(
    <>
      <h1>Before you start</h1>
      <p>This app gives general fitness information, based on the research in the Learn tab. It is not medical advice.</p>
      <p><b>Stop an exercise</b> if you feel sharp pain, numbness, tingling or an electric feeling down an arm or leg. See a physio or doctor if a pain lasts more than a week or two.</p>
      <p>Ask a Fitness Park coach to set the seat on the leg press, chest press and back extension the first time. It's free and takes two minutes.</p>
      <p className="muted">Back up now and then (Me, Backup): your data lives only on this phone.</p>
    </>,
    { label: "Start training", on: () => void finish() },
  );
}
