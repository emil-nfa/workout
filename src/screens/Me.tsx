import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type TextSize } from "../db/db";
import { updateSettings } from "../db/settings";
import { useApp } from "../state";
import { backupFileName, buildBackup, restoreBackup } from "../logic/backup";
import { daysSince } from "../logic/rotation";
import { isIOS, isStandalone, readFileBytes, saveFile, storageEstimate } from "../lib/platform";
import { strToU8 } from "fflate";
import { exportCsv, exportObsidianZip } from "../logic/exports";
import { ProgramEditor } from "./ProgramEditor";

export function Me() {
  const { settings } = useApp();
  const persist = useLiveQuery(() => db.meta.get("persist"));
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [pending, setPending] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => { void storageEstimate().then(setEst); }, []);

  async function doBackup() {
    setMsg("Preparing backup…");
    try {
      const { zip } = await buildBackup();
      const r = await saveFile(zip, backupFileName(), "application/zip");
      if (r === "cancelled") return setMsg("Backup cancelled.");
      await updateSettings({ lastBackupAt: new Date().toISOString() });
      setMsg(r === "shared" ? "Backup saved." : "Backup downloaded. Find it in Files, Downloads.");
    } catch (e) {
      setMsg(`Backup failed: ${(e as Error).message}`);
    }
  }

  async function doRestore() {
    if (!pending) return;
    try {
      const s = await restoreBackup(await readFileBytes(pending));
      setMsg(`Restored ${s.sessions} workouts, ${s.sets} sets, ${s.stretchLogs} stretch sessions${s.photos ? `, ${s.photos} photos` : ""}.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setPending(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const age = daysSince(settings.lastBackupAt);
  if (editing) return <ProgramEditor onBack={() => { setEditing(false); scrollTo(0, 0); }} />;
  const stamp = new Date().toISOString().slice(0, 10);
  const persistState = (persist?.value as { state?: string } | undefined)?.state;
  const mb = (n: number) => (n / 1_048_576).toFixed(n < 10_485_760 ? 1 : 0);

  return (
    <>
      <h1>Me</h1>

      <h2>Program</h2>
      <button className="btn big" onClick={() => { setEditing(true); scrollTo(0, 0); }}>See and edit your program</button>

      <h2>Backup</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Your data lives only on this phone. A backup is one file (workouts, stretches, settings, machine photos) you save to Files or iCloud Drive.
      </p>
      <p>Last backup: <b>{age === null ? "never" : age === 0 ? "today" : `${age} day${age === 1 ? "" : "s"} ago`}</b></p>
      <div className="stack">
        <button className="btn primary big" onClick={doBackup}>Back up now</button>
        <label className="btn big" style={{ cursor: "pointer" }}>
          Restore from a backup file
          <input ref={fileRef} type="file" accept=".zip,.json,application/zip,application/json" className="sr-only"
            onChange={(e) => setPending(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      {pending && (
        <div className="banner warn" role="alertdialog" aria-label="Confirm restore" style={{ marginTop: "var(--s3)", display: "block" }}>
          <p><b>Replace everything on this phone</b> with “{pending.name}”? This can't be undone. Back up first if unsure.</p>
          <div style={{ display: "flex", gap: "var(--s2)", marginTop: "var(--s3)" }}>
            <button className="btn danger" onClick={doRestore}>Replace my data</button>
            <button className="btn" onClick={() => { setPending(null); if (fileRef.current) fileRef.current.value = ""; }}>Cancel</button>
          </div>
        </div>
      )}
      {msg && <p role="status" style={{ marginTop: "var(--s3)" }}>{msg}</p>}

      <h2>Export</h2>
      <div className="stack">
        <button className="btn big" onClick={async () => { const r = await saveFile(strToU8(await exportCsv()), `workout-sets-${stamp}.csv`, "text/csv"); setMsg(r === "downloaded" ? "CSV downloaded." : ""); }}>Spreadsheet (CSV) of every set</button>
        <button className="btn big" onClick={async () => { const r = await saveFile(await exportObsidianZip(), `workout-log-${stamp}.zip`, "application/zip"); setMsg(r === "downloaded" ? "Notes downloaded: unzip into your Obsidian vault." : ""); }}>Obsidian notes (one per session)</button>
      </div>

      <h2>Machines</h2>
      <div className="field">
        <span>Plate-loaded machines: enter the weight as</span>
        <div className="seg" role="group" aria-label="Plate weight entry">
          <button aria-pressed={settings.plateMode === "total"} onClick={() => updateSettings({ plateMode: "total" })}>Total plates</button>
          <button aria-pressed={settings.plateMode === "perSide"} onClick={() => updateSettings({ plateMode: "perSide" })}>Per side</button>
        </div>
      </div>

      <h2>Display</h2>
      <div className="field">
        <span>Text size</span>
        <div className="seg" role="group" aria-label="Text size">
          {(["normal", "large", "xlarge"] as TextSize[]).map((t) => (
            <button key={t} aria-pressed={settings.textSize === t} onClick={() => updateSettings({ textSize: t })}>
              {t === "normal" ? "Normal" : t === "large" ? "Large" : "Extra large"}
            </button>
          ))}
        </div>
      </div>
      <label className="row" style={{ marginTop: "var(--s3)" }}>
        <span className="grow">Keep the screen on during workouts and stretches</span>
        <input type="checkbox" checked={settings.wakeLock} onChange={(e) => updateSettings({ wakeLock: e.target.checked })} style={{ width: 24, height: 24 }} />
      </label>

      <h2>Storage</h2>
      <ul className="ruled" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <li className="row"><span className="grow">Running as</span><b>{isStandalone() ? "Installed app" : "Browser tab"}</b></li>
        <li className="row"><span className="grow">Protected from clean-up</span><b>{persistState === "granted" ? "Yes" : persistState === "denied" ? "Not granted" : isStandalone() ? "Unknown" : "Install first"}</b></li>
        {est && <li className="row"><span className="grow">Space used</span><b className="num">{mb(est.usage)} MB</b></li>}
      </ul>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Removing the app from the Home Screen deletes its data. Back up first. Even when “protected” says no, the installed app is the safest place; backups are the real safety net.
      </p>

      <h2>Install on your iPhone</h2>
      <ol>
        <li>Open this page in <b>Safari</b>.</li>
        <li>Tap the <b>Share</b> button, then <b>Add to Home Screen</b>{isIOS() ? "" : " (on iPhone)"}.</li>
        <li>Open the app from its <b>Home Screen icon</b> and log everything there. The Safari tab keeps separate data.</li>
        <li>Open it once with signal so it saves itself for offline use in the gym.</li>
      </ol>

      <h2>About</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        General fitness information, not medical advice. Stop an exercise if you feel sharp pain, numbness or tingling, and see a doctor or physio if it persists.
      </p>
    </>
  );
}
