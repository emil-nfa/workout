import { useMemo, useState } from "react";
import { EXERCISES } from "../data/exercises";
import type { Exercise, ExerciseGroup } from "../data/types";

const GROUPS: ExerciseGroup[] = ["Back", "Chest", "Shoulders", "Posture", "Arms", "Legs", "Core", "Mobility", "Stretch"];

// M1: searchable list + plain detail. Figures, body maps, machine photos and Learn arrive in M3/M5.
export function Library() {
  const [q, setQ] = useState("");
  const [where, setWhere] = useState<"all" | "gym" | "home">("all");
  const [open, setOpen] = useState<Exercise | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return EXERCISES.filter(
      (e) =>
        (!s || `${e.name} ${e.fr} ${e.muscles}`.toLowerCase().includes(s)) &&
        (where === "all" || e.where === where || e.where === "both"),
    );
  }, [q, where]);

  if (open) return <Detail e={open} onBack={() => setOpen(null)} />;

  return (
    <>
      <h1>Library</h1>
      <div className="field" style={{ margin: "var(--s4) 0 var(--s3)" }}>
        <label htmlFor="q" className="sr-only">Search exercises</label>
        <input id="q" type="search" placeholder="Search: row, curl, squat, ischio…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="seg" role="group" aria-label="Where">
        {(["all", "gym", "home"] as const).map((w) => (
          <button key={w} aria-pressed={where === w} onClick={() => setWhere(w)}>{w === "all" ? "All" : w === "gym" ? "Gym" : "Home"}</button>
        ))}
      </div>
      {GROUPS.map((g) => {
        const items = list.filter((e) => e.group === g);
        if (!items.length) return null;
        return (
          <section key={g}>
            <h2>{g}</h2>
            <ul className="ruled" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((e) => (
                <li key={e.id}>
                  <button className="row" style={{ width: "100%", border: 0, background: "none", textAlign: "left" }} onClick={() => { setOpen(e); scrollTo(0, 0); }}>
                    <span className="grow">
                      <span style={{ fontWeight: 600 }}>{e.name}</span><br />
                      <span className="muted" style={{ fontSize: "0.85rem" }}>{e.fr}</span>
                    </span>
                    {e.posture && <span className="chip">Posture</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {!list.length && <p className="lede" style={{ marginTop: "var(--s5)" }}>No match.</p>}
    </>
  );
}

function Detail({ e, onBack }: { e: Exercise; onBack: () => void }) {
  return (
    <article>
      <button className="btn link" onClick={onBack} style={{ marginLeft: "calc(-1 * var(--s1))" }}>‹ Library</button>
      <h1>{e.name}</h1>
      <p className="lede">{e.fr}</p>
      <p><b>Works:</b> {e.muscles}</p>
      <p><b>Equipment:</b> {e.equipment}</p>
      <h2>How to</h2>
      <ol>{e.how.map((x, i) => <li key={i}>{x}</li>)}</ol>
      {!!e.cues.length && (<><h2>Cues</h2><ul>{e.cues.map((x, i) => <li key={i}>{x}</li>)}</ul></>)}
      {!!e.avoid.length && (<><h2>Avoid</h2><ul>{e.avoid.map((x, i) => <li key={i}>{x}</li>)}</ul></>)}
      {e.progression && <p><b>Progress:</b> {e.progression}</p>}
      {e.alternative && <p><b>If it's taken:</b> {e.alternative}</p>}
      <p><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " proper form")}`} target="_blank" rel="noreferrer">Watch videos on YouTube</a></p>
    </article>
  );
}
