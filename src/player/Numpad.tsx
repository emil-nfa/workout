import { useState } from "react";
import { Delete } from "lucide-react";
import { db, type LoggedSet } from "../db/db";
import { EXERCISE_BY_ID } from "../data/exercises";
import { fromPerSide, perSide, platesPerSide } from "../logic/progression";

export type PadField = "weight" | "reps" | "time" | "dist";

const fmt = (n?: number) => (n === undefined ? "" : Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));

/**
 * Bottom-sheet numpad: no system keyboard. Typing replaces the value; steppers nudge it.
 * Changing the weight of a set also updates the later, still-suggested sets of the same exercise.
 */
export function Numpad({ row, rows, field, onField, perSideMode, increment, onClose }: {
  row: LoggedSet; rows: LoggedSet[]; field: PadField; onField: (f: PadField) => void;
  perSideMode: boolean; increment: number; onClose: () => void;
}) {
  const ex = EXERCISE_BY_ID[row.exerciseId];
  const lt = ex?.loadType ?? "stack";
  const [buf, setBuf] = useState<string | null>(null);

  const stored = field === "weight" ? row.weight : field === "reps" ? row.reps : field === "time" ? row.durationSec : row.distanceM;
  const shown = field === "weight" && perSideMode && stored !== undefined ? perSide(stored) : stored;
  const display = buf ?? fmt(shown);
  const step = field === "weight" ? (perSideMode ? increment / 2 : increment) : field === "time" ? 5 : field === "dist" ? 5 : 1;
  const unit = field === "weight" ? (lt === "assisted" ? "kg of help" : perSideMode ? "kg per side" : lt === "dumbbell" ? "kg each" : lt === "bodyweight" ? "kg added" : "kg") : field === "reps" ? "reps" : field === "time" ? "seconds" : "metres";

  async function commit(v: number | undefined) {
    const val = v === undefined ? undefined : Math.max(0, field === "weight" && perSideMode ? fromPerSide(v) : v);
    const key = field === "weight" ? "weight" : field === "reps" ? "reps" : field === "time" ? "durationSec" : "distanceM";
    await db.transaction("rw", db.sets, async () => {
      await db.sets.update(row.id, { [key]: val, edited: true });
      if (field === "weight") {
        // Carry the new weight to later sets that are still just suggestions.
        const later = rows.filter((x) => x.slot === row.slot && x.order > row.order && !x.done && !x.edited && x.type === row.type);
        for (const x of later) await db.sets.update(x.id, { weight: val });
      }
    });
  }

  function press(k: string) {
    let s = buf ?? "";
    if (k === "back") s = s.slice(0, -1);
    else if (k === ".") { if (field !== "weight" || s.includes(".")) return; s = (s || "0") + "."; }
    else s = (s + k).replace(/^0+(?=\d)/, "").slice(0, 6);
    setBuf(s);
    const n = s === "" ? undefined : Number(s);
    if (s === "" || !Number.isNaN(n)) void commit(n);
  }

  function nudge(dir: 1 | -1, mult = 1) {
    const base = Number(display || 0);
    const n = Math.max(0, Math.round((base + dir * step * mult) * 100) / 100);
    setBuf(null);
    void commit(n);
  }

  function sameAsLast() {
    const prev = rows.filter((x) => x.slot === row.slot && x.order < row.order).sort((a, b) => b.order - a.order)[0];
    if (!prev) return;
    void db.sets.update(row.id, { weight: prev.weight, reps: prev.reps, durationSec: prev.durationSec, distanceM: prev.distanceM, edited: true });
    setBuf(null);
  }

  const fields: { f: PadField; label: string }[] =
    lt === "time" ? [{ f: "time", label: "Seconds" }]
    : lt === "distance" ? [{ f: "weight", label: "Kg" }, { f: "dist", label: "Metres" }]
    : [{ f: "weight", label: lt === "assisted" ? "Help kg" : "Kg" }, { f: "reps", label: "Reps" }];
  const hasPrev = rows.some((x) => x.slot === row.slot && x.order < row.order);
  const side = row.weight !== undefined && lt === "plate" ? platesPerSide(perSide(row.weight)) : null;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Edit ${unit}`} onClick={(e) => e.stopPropagation()}>
        {fields.length > 1 && (
          <div className="pad-tabs">
            {fields.map(({ f, label }) => (
              <button key={f} aria-pressed={field === f} onClick={() => { setBuf(null); onField(f); }}>{label}</button>
            ))}
          </div>
        )}
        <div className="pad-display">
          <span className="v" aria-live="polite">{display || <span style={{ color: "var(--suggest)" }}>0</span>}</span>
          <span className="u">{unit}</span>
        </div>
        <div className="steps">
          <button onClick={() => nudge(-1)} aria-label={`minus ${step}`}>−{fmt(step)}</button>
          <button onClick={() => nudge(1)} aria-label={`plus ${step}`}>+{fmt(step)}</button>
          {field === "weight" ? (
            <>
              <button onClick={() => nudge(-1, 4)} aria-label={`minus ${step * 4}`}>−{fmt(step * 4)}</button>
              <button onClick={() => nudge(1, 4)} aria-label={`plus ${step * 4}`}>+{fmt(step * 4)}</button>
            </>
          ) : (
            <>
              <button onClick={() => nudge(-1, 5)}>−{fmt(step * 5)}</button>
              <button onClick={() => nudge(1, 5)}>+{fmt(step * 5)}</button>
            </>
          )}
        </div>
        <div className="keys">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k) => (
            <button key={k} onClick={() => press(k)} disabled={k === "." && field !== "weight"} aria-label={k === "back" ? "Delete digit" : k}>
              {k === "back" ? <Delete aria-hidden /> : k}
            </button>
          ))}
        </div>

        {side && field === "weight" && (
          <div className="pad-extra">
            <span className="lbl">Plates on each side</span>
            <span className="plates">{side.plates.length ? side.plates.map(fmt).join(" + ") : "none"}{side.remainder ? ` (+${fmt(side.remainder)} kg can't be made)` : ""}</span>
          </div>
        )}

        {field === "reps" && (
          <div className="pad-extra rir">
            <span className="lbl">Reps left in the tank (optional)</span>
            {[0, 1, 2, 3, 4].map((n) => (
              <button key={n} aria-pressed={row.rir === n} onClick={() => db.sets.update(row.id, { rir: row.rir === n ? undefined : n })}>{n === 4 ? "4+" : n}</button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "var(--s2)", marginTop: "var(--s2)" }}>
          {hasPrev && <button className="btn" style={{ flex: 1 }} onClick={sameAsLast}>Same as last set</button>}
          <button className="btn primary" style={{ flex: 1, minHeight: 52 }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
