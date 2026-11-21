// CSV export of every logged set, and an Obsidian-friendly Markdown export (one note per session, zipped).
import { strToU8, zipSync } from "fflate";
import { db, type WorkoutDB } from "../db/db";
import { EXERCISE_BY_ID } from "../data/exercises";
import { DEFAULT_PROGRAM } from "../data/program";

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportCsv(d: WorkoutDB = db): Promise<string> {
  const sessions = new Map((await d.sessions.toArray()).filter((s) => s.status === "finished").map((s) => [s.id, s]));
  const sets = (await d.sets.toArray()).filter((x) => x.done && sessions.has(x.sessionId));
  sets.sort((a, b) => sessions.get(a.sessionId)!.startedAt.localeCompare(sessions.get(b.sessionId)!.startedAt) || a.slot - b.slot || a.order - b.order);
  const head = ["date", "time", "session", "exercise", "exercise_fr", "set_type", "set", "weight_kg", "reps", "seconds", "metres", "reps_in_reserve", "note"];
  const rows = sets.map((x) => {
    const s = sessions.get(x.sessionId)!;
    const e = EXERCISE_BY_ID[x.exerciseId];
    const dt = new Date(s.startedAt);
    return [dt.toISOString().slice(0, 10), dt.toTimeString().slice(0, 5), s.key, e?.name ?? x.exerciseId, e?.fr ?? "", x.type, x.order + 1, x.weight, x.reps, x.durationSec, x.distanceM, x.rir, x.note].map(csvCell).join(",");
  });
  return [head.join(","), ...rows].join("\n") + "\n";
}

/** One Markdown note per finished workout plus one for each stretch session, in a "Workout log" folder. */
export async function exportObsidianZip(d: WorkoutDB = db): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const sessions = (await d.sessions.toArray()).filter((s) => s.status === "finished");
  const sets = await d.sets.toArray();
  const titles = Object.fromEntries(DEFAULT_PROGRAM.sessions.map((s) => [s.key, s.title]));
  for (const s of sessions) {
    const date = new Date(s.startedAt).toISOString().slice(0, 10);
    const mins = s.endedAt ? Math.round((+new Date(s.endedAt) - +new Date(s.startedAt)) / 60000) : undefined;
    const own = sets.filter((x) => x.sessionId === s.id && x.done).sort((a, b) => a.slot - b.slot || a.order - b.order);
    const lines = ["---", `date: ${date}`, `type: workout`, `session: ${s.key}`, mins !== undefined ? `minutes: ${mins}` : "", `tags: [workout]`, "---", "", `# ${date} · ${s.key} ${titles[s.key] ?? ""}`.trim(), ""];
    for (const slot of [...new Set(own.map((x) => x.slot))]) {
      const g = own.filter((x) => x.slot === slot);
      const e = EXERCISE_BY_ID[g[0].exerciseId];
      lines.push(`## ${e?.name ?? g[0].exerciseId}`, `*${e?.fr ?? ""}*`, "", "| Set | kg | Reps | Left |", "|---|---|---|---|");
      g.forEach((x, i) => lines.push(`| ${x.type === "warmup" ? "W" : i + 1} | ${x.weight ?? "BW"} | ${x.durationSec !== undefined ? `${x.durationSec} s` : x.reps ?? ""} | ${x.rir ?? ""} |`));
      lines.push("");
    }
    if (s.note) lines.push("## Notes", s.note, "");
    files[`Workout log/${date} ${s.key}.md`] = strToU8(lines.filter((l, i, a) => !(l === "" && a[i - 1] === "" && i > 0)).join("\n"));
  }
  for (const l of await d.stretchLogs.toArray()) {
    files[`Workout log/${l.date} stretch ${l.routine}.md`] = strToU8(["---", `date: ${l.date}`, "type: stretch", `routine: ${l.routine}`, `minutes: ${Math.round(l.durationSec / 60)}`, `completed: ${l.completed}`, "tags: [stretch]", "---", "", `# ${l.date} · ${l.routine} stretch`, ""].join("\n"));
  }
  return zipSync(files);
}
