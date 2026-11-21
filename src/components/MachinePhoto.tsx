// Your own photo of the real machine at the gym: answers "which machine is this?". Stored on the phone, in backups.
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, Trash2 } from "lucide-react";
import { db, newId } from "../db/db";

/** Shrinks a camera photo to about 150 KB (longest side 1000 px, JPEG). */
export async function shrinkPhoto(file: Blob, maxSide = 1000, quality = 0.72): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not read the photo"))), "image/jpeg", quality));
}

export function MachinePhoto({ exerciseId }: { exerciseId: string }) {
  const photo = useLiveQuery(() => db.machinePhotos.where("exerciseId").equals(exerciseId).first(), [exerciseId]);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setUrl(null); return; }
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  async function onPick(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      const blob = await shrinkPhoto(f);
      await db.transaction("rw", db.machinePhotos, async () => {
        await db.machinePhotos.where("exerciseId").equals(exerciseId).delete();
        await db.machinePhotos.put({ id: newId(), exerciseId, blob, createdAt: new Date().toISOString() });
      });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      {url ? (
        <figure style={{ margin: 0 }}>
          <img src={url} alt="Your photo of the machine" style={{ width: "100%", maxWidth: 420, borderRadius: 12, display: "block" }} />
          <figcaption style={{ display: "flex", gap: "var(--s2)", marginTop: "var(--s2)" }}>
            <label className="btn" style={{ cursor: "pointer" }}><Camera size={18} aria-hidden /> Replace<input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} /></label>
            {!confirm ? (
              <button className="btn" onClick={() => setConfirm(true)} aria-label="Remove photo"><Trash2 size={18} aria-hidden /></button>
            ) : (
              <button className="btn danger" onClick={() => { void db.machinePhotos.delete(photo!.id); setConfirm(false); }}>Remove photo</button>
            )}
          </figcaption>
        </figure>
      ) : (
        <label className="btn big" style={{ cursor: "pointer" }}>
          <Camera size={20} aria-hidden /> {busy ? "Saving…" : "Add a photo of the machine"}
          <input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
