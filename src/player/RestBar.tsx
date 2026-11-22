import { useEffect, useRef } from "react";
import { db } from "../db/db";
import { beep } from "../lib/platform";
import { fmtClock } from "../logic/rotation";
import { useNow } from "./Player";

export interface RestState {
  endsAt: number; // epoch ms: the countdown is computed from this, so it survives the screen locking
  totalSec: number; // this rest's length (after −15 / +15)
  defaultSec: number; // the exercise's default
  exerciseId: string;
  nextLabel: string;
  nextValue: string;
}

/**
 * Compact rest bar in the thumb zone (~120 px), the next set row stays visible above it.
 * −15 / +15 change THIS rest only; "Save as default" stores it for the exercise.
 */
export function RestBar({ rest }: { rest: RestState }) {
  const now = useNow(250);
  // Never show more than this rest's length (the shared clock can be up to a second old when the rest starts).
  const left = Math.min(rest.totalSec, Math.ceil((rest.endsAt - now) / 1000));
  const over = left <= 0;
  const beeped = useRef<number | null>(null);

  useEffect(() => {
    if (over && beeped.current !== rest.endsAt) {
      beeped.current = rest.endsAt;
      // Only beep if we're within a few seconds of the end (not when reopening the app much later).
      if (now - rest.endsAt < 5000) beep(2);
    }
  }, [over, rest.endsAt, now]);

  // Hide the bar 20 s after the rest ended.
  useEffect(() => {
    if (over && now - rest.endsAt > 20_000) void db.meta.delete("rest");
  }, [over, now, rest.endsAt]);

  const adjust = (d: number) => db.meta.put({ key: "rest", value: { ...rest, endsAt: rest.endsAt + d * 1000, totalSec: Math.max(0, rest.totalSec + d) } });
  const saveDefault = async () => {
    const pref = (await db.exercisePrefs.get(rest.exerciseId)) ?? { exerciseId: rest.exerciseId };
    await db.exercisePrefs.put({ ...pref, restSec: rest.totalSec });
    await db.meta.put({ key: "rest", value: { ...rest, defaultSec: rest.totalSec } });
  };

  return (
    <div className={`rest${over ? " over" : ""}`} role="timer" aria-live="off" aria-label={over ? "Rest over" : `Rest, ${fmtClock(left)} left`}>
      <div className="rest-row">
        <div>
          <div className="big">{over ? "Go" : fmtClock(left)}</div>
        </div>
        <div className="ctl">
          {!over && <button onClick={() => adjust(-15)} aria-label="15 seconds less">−15</button>}
          {!over && <button onClick={() => adjust(15)} aria-label="15 seconds more">+15</button>}
          <button className="skip" onClick={() => db.meta.delete("rest")}>{over ? "Close" : "Skip"}</button>
        </div>
      </div>
      <div className="next">Next: <b>{rest.nextLabel}</b>{rest.nextValue && <> · <b>{rest.nextValue}</b></>}</div>
      {rest.totalSec !== rest.defaultSec && !over && (
        <button className="save" onClick={saveDefault}>This rest only. Save {fmtClock(rest.totalSec)} as default</button>
      )}
    </div>
  );
}
