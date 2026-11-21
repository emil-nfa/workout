import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { fmtClock } from "../logic/rotation";

// M1: history list. Calendar heatmap, session detail and Progress charts arrive in M5.
export function Journal() {
  const [view, setView] = useState<"history" | "progress">("history");
  const sessions = useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().filter((s) => s.status === "finished").toArray());
  const stretches = useLiveQuery(() => db.stretchLogs.orderBy("date").reverse().toArray());
  if (!sessions || !stretches) return null;

  const items = [
    ...sessions.map((s) => ({ at: s.startedAt, title: `${s.key} · workout`, sub: s.endedAt ? fmtClock((+new Date(s.endedAt) - +new Date(s.startedAt)) / 1000) : "" })),
    ...stretches.map((l) => ({ at: l.startedAt, title: `${l.routine[0].toUpperCase()}${l.routine.slice(1)} stretch`, sub: l.durationSec ? fmtClock(l.durationSec) : "" })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <h1>Journal</h1>
      <div className="seg" role="group" aria-label="View" style={{ margin: "var(--s4) 0 var(--s5)" }}>
        <button aria-pressed={view === "history"} onClick={() => setView("history")}>History</button>
        <button aria-pressed={view === "progress"} onClick={() => setView("progress")}>Progress</button>
      </div>
      {view === "history" ? (
        items.length ? (
          <ul className="ruled" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((it, i) => (
              <li key={i} className="row">
                <span className="num muted" style={{ width: "5.5em" }}>{new Date(it.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                <span className="grow">{it.title}</span>
                <span className="num muted">{it.sub}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lede">Nothing yet. Finished workouts and stretch sessions show up here.</p>
        )
      ) : (
        <p className="lede">Charts of your top sets, estimated max, weekly sets per muscle and personal records appear here once you have a few sessions.</p>
      )}
    </>
  );
}
