import { useMemo, useState } from "react";
import { ExerciseThumb, ExerciseVideo } from "../components/ExerciseVisual";
import { BodyMap } from "../components/BodyMap";
import { EXERCISES } from "../data/exercises";
import { LEARN } from "../data/learn";
import { SOURCES } from "../data/sources";
import type { Exercise, ExerciseGroup } from "../data/types";
import { scrollTop } from "../lib/scroll";

const GROUPS: ExerciseGroup[] = ["Back", "Chest", "Shoulders", "Posture", "Arms", "Legs", "Core", "Mobility", "Stretch"];

// Searchable exercise list; detail page with the 3D loop, body map, machine at the gym and your own photo.
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

  const [tab, setTab] = useState<"exercises" | "learn">("exercises");
  if (open) return <Detail e={open} onBack={() => setOpen(null)} />;

  const header = (
    <>
      <h1>Library</h1>
      <div className="seg" role="group" aria-label="Section" style={{ margin: "var(--s4) 0" }}>
        <button aria-pressed={tab === "exercises"} onClick={() => setTab("exercises")}>Exercises</button>
        <button aria-pressed={tab === "learn"} onClick={() => setTab("learn")}>Learn</button>
      </div>
    </>
  );
  if (tab === "learn") return <>{header}<Learn /></>;

  return (
    <>
      {header}
      <div className="field" style={{ margin: "0 0 var(--s3)" }}>
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
                  <button className="row list-row" style={{ width: "100%", border: 0, background: "none", textAlign: "left" }} onClick={() => { setOpen(e); scrollTop(); }}>
                    <ExerciseThumb id={e.id} size={56} />
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
    <article className="prose">
      <button className="btn link" onClick={onBack} style={{ marginLeft: "calc(-1 * var(--s1))" }}>‹ Library</button>
      <h1>{e.name}</h1>
      <p className="lede">{e.fr}</p>
      <ExerciseVideo id={e.id} name={e.name} />
      <h2>How to</h2>
      <ol>{e.how.map((x, i) => <li key={i}>{x}</li>)}</ol>
      {!!e.cues.length && (<><h2>Cues</h2><ul>{e.cues.map((x, i) => <li key={i}>{x}</li>)}</ul></>)}
      {!!e.avoid.length && (<><h2>Avoid</h2><ul>{e.avoid.map((x, i) => <li key={i}>{x}</li>)}</ul></>)}
      {e.progression && <p><b>Progress:</b> {e.progression}</p>}
      <h2>Muscles</h2>
      <p style={{ marginTop: 0 }}>{e.muscles}</p>
      <BodyMap primary={e.primary} secondary={e.secondary} />
      <h2>At the gym</h2>
      <p style={{ marginTop: 0 }}><b>Machine:</b> {e.machine ?? e.equipment}</p>
      {e.alternative && <p><b>If it's taken:</b> {e.alternative}</p>}
      <p style={{ marginTop: "var(--s5)" }}><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " proper form")}`} target="_blank" rel="noreferrer">Watch videos on YouTube</a></p>
    </article>
  );
}

function Learn() {
  return (
    <>
      <p className="lede">Why the plan looks the way it does, in plain words. Each card says how strong the evidence is.</p>
      {LEARN.map((c) => (
        <details key={c.id} className="prose" style={{ padding: "var(--s2) 0", borderBottom: "1px solid var(--rule)" }}>
          <summary style={{ minHeight: "var(--tap)", display: "flex", alignItems: "center", gap: "var(--s2)", cursor: "pointer", fontWeight: 600, fontSize: "1.05rem" }}>
            <span className="grow" style={{ flex: 1 }}>{c.title}</span><span className="chip">{c.evidence}</span>
          </summary>
          {c.body.map((p, i) => <p key={i}>{p}</p>)}
          <p className="caps muted" style={{ marginBottom: 4 }}>Sources</p>
          <ul style={{ margin: 0, paddingLeft: "1.1em", fontSize: "0.85rem" }}>
            {c.sources.map((id) => SOURCES[id]).filter(Boolean).map((src) => (
              <li key={src.id}>{src.url ? <a href={src.url} target="_blank" rel="noreferrer">{src.title}</a> : src.title}</li>
            ))}
          </ul>
        </details>
      ))}
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: "var(--s5)" }}>General fitness information, not medical advice.</p>
    </>
  );
}
