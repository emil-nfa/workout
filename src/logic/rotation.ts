// Which session is next in the rotation, and other small date helpers. Pure functions.
import type { Program, SessionKey } from "../data/types";

/** Next session key: the one after the last finished rotation session; "A" if none. Bonus (E) never moves the rotation. */
export function nextSessionKey(program: Program, finishedKeysNewestFirst: string[]): SessionKey {
  const rot = program.rotation;
  const last = finishedKeysNewestFirst.find((k) => rot.includes(k as SessionKey));
  if (!last) return rot[0];
  return rot[(rot.indexOf(last as SessionKey) + 1) % rot.length];
}

export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Days in a row (ending today, or yesterday if today isn't done yet) with at least one stretch log. */
export function streak(dates: Set<string>, today = new Date()): number {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!dates.has(localDate(day))) day.setDate(day.getDate() - 1);
  let n = 0;
  while (dates.has(localDate(day))) {
    n++;
    day.setDate(day.getDate() - 1);
  }
  return n;
}

export function daysSince(iso: string | undefined, now = new Date()): number | null {
  if (!iso) return null;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** Rough session length in minutes: 7 min warm-up + per set ~45 s of work + its rest. Supersets share rest. */
export function estimateMinutes(slots: { sets: number; restSec: number; superset?: string; perSide?: boolean }[]): number {
  let sec = 7 * 60;
  const seenSuperset = new Set<string>();
  for (const s of slots) {
    const work = (s.perSide ? 70 : 45) * s.sets;
    sec += work;
    if (s.superset) {
      if (seenSuperset.has(s.superset)) continue;
      seenSuperset.add(s.superset);
    }
    sec += s.restSec * s.sets;
  }
  return Math.round(sec / 60);
}

export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
