import { useEffect, useState } from "react";
import { db, type WorkoutSession } from "../db/db";
import { useApp } from "../state";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { ProgramSession } from "../data/types";
import { summarize, type Summary } from "../logic/workout";
import { fmtClock } from "../logic/rotation";
import { saveFile } from "../lib/platform";
import { renderStatCard } from "./statcard";

/**
 * Finish: if sets are unticked, a clear choice (only ticked / mark all done, confirmed / keep going).
 * Then the summary with PRs and the shareable stat card.
 */
export function FinishFlow({ session, ps, undone, onBack }: { session: WorkoutSession; ps: ProgramSession; undone: number; onBack: () => void }) {
  const { setPlayer } = useApp();
  const [stage, setStage] = useState<"ask" | "summary">(undone ? "ask" : "summary");
  const [confirmAll, setConfirmAll] = useState(false);
  const [sum, setSum] = useState<Summary | null>(null);
  const [ended, setEnded] = useState<WorkoutSession | null>(null);
  const [shareMsg, setShareMsg] = useState("");

  async function end(mode: "ticked" | "all") {
    const endedAt = new Date().toISOString();
    await db.transaction("rw", db.sessions, db.sets, db.meta, async () => {
      const pending = await db.sets.where("sessionId").equals(session.id).filter((r) => !r.done).toArray();
      if (mode === "all") for (const r of pending) await db.sets.update(r.id, { done: true, at: endedAt });
      else await db.sets.bulkDelete(pending.map((r) => r.id));
      await db.sessions.update(session.id, { status: "finished", endedAt });
      await db.meta.delete("rest");
    });
    const s = { ...session, endedAt, status: "finished" as const };
    setEnded(s);
    setSum(await summarize(s));
    setStage("summary");
  }

  useEffect(() => { if (!undone) void end("ticked"); }, []); // nothing left to decide

  if (stage === "ask") {
    return (
      <div className="wk dialog" style={{ paddingTop: "calc(var(--safe-t) + var(--s6))", paddingBottom: "calc(var(--safe-b) + var(--s4))", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <h2 style={{ font: "700 2rem/1.1 var(--font-num)", margin: "0 0 var(--s3)" }}>{undone} set{undone === 1 ? "" : "s"} not ticked</h2>
        <p className="muted">Only ticked sets count. Nothing is logged that you didn't do unless you say so.</p>
        <button className="btn primary big" onClick={() => end("ticked")}>Save only the ticked sets</button>
        {!confirmAll ? (
          <button className="btn big" onClick={() => setConfirmAll(true)}>I did them all: mark all done</button>
        ) : (
          <button className="btn big" style={{ borderColor: "var(--accent)" }} onClick={() => end("all")}>Confirm: log all {undone} with the numbers shown</button>
        )}
        <button className="btn big" onClick={onBack}>Keep going</button>
      </div>
    );
  }

  if (!sum || !ended) return <div className="wk" />;

  async function share() {
    const blob = await renderStatCard(ended!, ps, sum!);
    const r = await saveFile(new Uint8Array(await blob.arrayBuffer()), `workout-${ended!.startedAt.slice(0, 10)}.png`, "image/png");
    setShareMsg(r === "downloaded" ? "Image saved to Downloads." : "");
  }

  return (
    <div className="wk" style={{ paddingTop: "calc(var(--safe-t) + var(--s6))", paddingBottom: "calc(var(--safe-b) + var(--s4))", display: "flex", flexDirection: "column" }}>
      <p className="caps muted" style={{ margin: 0 }}>Done</p>
      <h1 style={{ font: "700 2.6rem/1 var(--font-num)", margin: "var(--s1) 0 0", textTransform: "uppercase" }}>{ended.key} · {ps.title}</h1>
      <div className="sumgrid">
        <div><div className="k">Time</div><div className="v">{fmtClock(sum.durationSec)}</div></div>
        <div><div className="k">Sets</div><div className="v">{sum.sets}</div></div>
        <div><div className="k">Volume</div><div className="v">{sum.volumeKg.toLocaleString("en-GB")}<span style={{ fontSize: "1rem" }}> kg</span></div></div>
      </div>
      {sum.prs.length ? (
        <>
          <p className="caps muted">Personal records</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sum.prs.map((p) => (
              <li key={p.exerciseId} className="row" style={{ borderBottom: "1px solid var(--rule)" }}>
                <span className="chip pr">PR</span>
                <span className="grow">{EXERCISE_BY_ID[p.exerciseId]?.name}</span>
                <span className="num" style={{ fontSize: "1.3rem", fontWeight: 600 }}>{p.weight} × {p.reps}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">No records this time. Consistency is what builds them.</p>
      )}
      <div className="stack" style={{ marginTop: "auto", paddingTop: "var(--s5)" }}>
        <button className="btn big" onClick={share}>Share stat card</button>
        {shareMsg && <p className="muted" role="status">{shareMsg}</p>}
        <button className="btn primary big" onClick={() => setPlayer({ open: false })}>Done</button>
      </div>
    </div>
  );
}
