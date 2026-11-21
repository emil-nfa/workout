// Backup = the safety net for local-only storage.
// Format: a .zip holding data.json (every table except photo blobs) and photos/<id>.<ext>.
// Import accepts that .zip, a bare data.json, or the v1 prototype's JSON ({hist, str}).
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { db, newId, TABLES, type LoggedSet, type StretchLog, type WorkoutDB, type WorkoutSession } from "../db/db";
import { DEFAULT_PROGRAM } from "../data/program";

export const BACKUP_FORMAT = "workout-backup";
export const BACKUP_VERSION = 1;

interface PhotoEntry { id: string; exerciseId: string; createdAt: string; file: string; type: string }

export interface BackupData {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  tables: Record<string, unknown[]>;
  photos: PhotoEntry[];
}

const extFor = (type: string) => (type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg");

export async function buildBackup(d: WorkoutDB = db, now = new Date()): Promise<{ zip: Uint8Array; data: BackupData }> {
  const tables: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    if (t === "machinePhotos") continue;
    tables[t] = await d.table(t).toArray();
  }
  const files: Record<string, Uint8Array> = {};
  const photos: PhotoEntry[] = [];
  for (const p of await d.machinePhotos.toArray()) {
    const file = `photos/${p.id}.${extFor(p.blob.type)}`;
    files[file] = new Uint8Array(await blobToArrayBuffer(p.blob));
    photos.push({ id: p.id, exerciseId: p.exerciseId, createdAt: p.createdAt, file, type: p.blob.type || "image/jpeg" });
  }
  const data: BackupData = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), tables, photos };
  files["data.json"] = strToU8(JSON.stringify(data));
  // Photos are already compressed: store them, deflate only the JSON.
  const zip = zipSync(
    Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: k.endsWith(".json") ? 6 : 0 }]])),
  );
  return { zip, data };
}

export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `workout-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.zip`;
}

export type ImportKind = "backup" | "v1";
export interface ImportSummary { kind: ImportKind; sessions: number; sets: number; stretchLogs: number; photos: number }

/** Parses a backup file without touching the database. Throws a readable Error if it isn't one. */
export function parseBackup(bytes: Uint8Array): { kind: ImportKind; data: BackupData; photoFiles: Record<string, Uint8Array> } {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isZip) {
    const files = unzipSync(bytes);
    if (!files["data.json"]) throw new Error("This zip has no data.json: not a backup from this app.");
    const data = JSON.parse(strFromU8(files["data.json"])) as BackupData;
    if (data.format !== BACKUP_FORMAT) throw new Error("Unknown backup format.");
    if (data.version > BACKUP_VERSION) throw new Error("This backup comes from a newer version of the app. Update the app first.");
    return { kind: "backup", data, photoFiles: files };
  }
  let json: unknown;
  try {
    json = JSON.parse(strFromU8(bytes));
  } catch {
    throw new Error("That file is not a backup (not a zip, not JSON).");
  }
  const o = json as Record<string, unknown>;
  if (o && o.format === BACKUP_FORMAT) return { kind: "backup", data: o as unknown as BackupData, photoFiles: {} };
  if (o && Array.isArray(o.hist)) return { kind: "v1", data: fromV1(o as unknown as V1Shape), photoFiles: {} };
  throw new Error("That JSON is not a backup from this app or from v1.");
}

/** Replaces everything in the database with the backup's contents. */
export async function restoreBackup(bytes: Uint8Array, d: WorkoutDB = db): Promise<ImportSummary> {
  const { kind, data, photoFiles } = parseBackup(bytes);
  const photos = data.photos
    .filter((p) => photoFiles[p.file])
    .map((p) => ({ id: p.id, exerciseId: p.exerciseId, createdAt: p.createdAt, blob: new Blob([photoFiles[p.file]], { type: p.type }) }));
  await d.transaction("rw", TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) {
      if (kind === "v1" && (t === "settings" || t === "programs")) continue; // v1 has none: keep current
      await d.table(t).clear();
    }
    for (const [t, rows] of Object.entries(data.tables)) {
      if (!(TABLES as readonly string[]).includes(t) || t === "machinePhotos") continue;
      if (rows.length) await d.table(t).bulkPut(rows);
    }
    if (photos.length) await d.machinePhotos.bulkPut(photos);
  });
  return {
    kind,
    sessions: data.tables.sessions?.length ?? 0,
    sets: data.tables.sets?.length ?? 0,
    stretchLogs: data.tables.stretchLogs?.length ?? 0,
    photos: photos.length,
  };
}

// ---------- v1 prototype import ----------
// v1 localStorage key "emilgym.v1": {hist:[{d:"YYYY-MM-DD", s:"A", ex:{id:[[kg,reps],...]}}], str:{date:{m:1,n:1}}}

interface V1Shape {
  hist: { d: string; s: string; ex: Record<string, [string | number, string | number][]> }[];
  str?: Record<string, { m?: number; n?: number }>;
}

function fromV1(v1: V1Shape): BackupData {
  const sessions: WorkoutSession[] = [];
  const sets: LoggedSet[] = [];
  for (const h of v1.hist) {
    const id = newId();
    const at = `${h.d}T12:00:00.000Z`;
    const key = (["A", "B", "C", "D", "E"].includes(h.s) ? h.s : "custom") as WorkoutSession["key"];
    sessions.push({ id, key, programId: DEFAULT_PROGRAM.id, startedAt: at, endedAt: at, status: "finished" });
    let slot = 0;
    for (const [exerciseId, rows] of Object.entries(h.ex ?? {})) {
      rows.forEach(([kg, reps], order) => {
        const weight = kg === "" || kg == null ? undefined : Number(kg);
        const r = reps === "" || reps == null ? undefined : Number(reps);
        sets.push({ id: newId(), sessionId: id, exerciseId, slot, order, type: "working", weight, reps: r, done: true, at });
      });
      slot++;
    }
  }
  const stretchLogs: StretchLog[] = [];
  for (const [date, v] of Object.entries(v1.str ?? {})) {
    const startedAt = `${date}T12:00:00.000Z`;
    if (v.m) stretchLogs.push({ id: newId(), date, routine: "morning", startedAt, durationSec: 0, completed: true });
    if (v.n) stretchLogs.push({ id: newId(), date, routine: "evening", startedAt, durationSec: 0, completed: true });
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables: { sessions, sets, stretchLogs }, photos: [] };
}

function blobToArrayBuffer(b: Blob): Promise<ArrayBuffer> {
  if (typeof b.arrayBuffer === "function") return b.arrayBuffer();
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as ArrayBuffer);
    r.onerror = () => rej(r.error);
    r.readAsArrayBuffer(b);
  });
}
