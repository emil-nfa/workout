// The exercise visual: a small still for lists and cards, the looping 3D video for detail views.
// Videos are fetched whole (served from the offline precache) and played from a blob URL: iOS Safari asks for byte
// ranges when it streams a <video>, which a service-worker cache can't answer offline.
import { useEffect, useRef, useState } from "react";
import { FIGURE_IDS } from "../figures/ids";

const base = import.meta.env.BASE_URL;
export const hasFigure = (id: string) => FIGURE_IDS.has(id);
export const thumbUrl = (id: string) => `${base}figures3d/${id}-48.png`;
export const posterUrl = (id: string) => `${base}figures3d/${id}.jpg`;
const videoUrl = (id: string) => `${base}figures3d/${id}.mp4`;

// Keep the video bytes (not the blob: URL): after hours in the background iOS can drop a blob URL's data, so
// each mounted video makes its own URL and frees it when it unmounts.
const blobCache = new Map<string, Promise<Blob>>();
function videoBlob(id: string, fresh = false): Promise<Blob> {
  let p = fresh ? undefined : blobCache.get(id);
  if (!p) {
    p = fetch(videoUrl(id), { cache: fresh ? "reload" : "default" }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); });
    p.catch(() => blobCache.delete(id));
    blobCache.set(id, p);
  }
  return p;
}

export function ExerciseThumb({ id, size = 48, label }: { id: string; size?: number; label?: string }) {
  if (!hasFigure(id)) return <span className="thumb" style={{ width: size, height: size }} aria-hidden>{label}</span>;
  return <img className="thumb-img" src={thumbUrl(id)} width={size} height={size} alt="" loading="lazy" style={{ width: size, height: size, borderRadius: 12, objectFit: "cover", display: "block", background: "#1f1f1f" }} />;
}

export function ExerciseVideo({ id, name }: { id: string; name: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [play, setPlay] = useState(!reduce);
  const [blocked, setBlocked] = useState(false); // autoplay refused (e.g. Low Power Mode): show a play button
  const [attempt, setAttempt] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);

  // Load the bytes and make this video's own blob URL.
  useEffect(() => {
    if (!play || !hasFigure(id)) return;
    let alive = true, url: string | null = null;
    videoBlob(id, attempt > 0)
      .then((b) => { if (!alive) return; url = URL.createObjectURL(b); setSrc(url); })
      .catch(() => alive && setSrc(null));
    return () => { alive = false; setSrc(null); if (url) URL.revokeObjectURL(url); };
  }, [id, play, attempt]);

  const tryPlay = () => {
    const v = ref.current;
    if (!v) return;
    v.play().then(() => setBlocked(false), () => setBlocked(true));
  };

  // iOS pauses videos when the app goes to the background; start again when it comes back.
  useEffect(() => {
    const wake = () => { if (document.visibilityState === "visible") tryPlay(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", wake);
    return () => { document.removeEventListener("visibilitychange", wake); window.removeEventListener("pageshow", wake); };
  }, []);

  if (!hasFigure(id)) return null;
  return (
    <div style={{ position: "relative", aspectRatio: "1", width: "100%", maxWidth: 420, margin: "0 auto", borderRadius: 24, overflow: "hidden", background: "#1f1f1f" }}>
      {src && play ? (
        <video
          ref={ref} src={src} poster={posterUrl(id)} autoPlay loop muted playsInline preload="auto"
          aria-label={`${name}, looping 3D demonstration`} style={{ width: "100%", height: "100%", display: "block" }}
          onLoadedData={tryPlay}
          onPlaying={() => setBlocked(false)}
          // A dead blob URL or a bad cached copy: fetch the file again (twice at most).
          onError={() => { if (attempt < 2) setAttempt((n) => n + 1); }}
        />
      ) : (
        <img src={posterUrl(id)} alt={`${name}, end position`} style={{ width: "100%", height: "100%", display: "block" }} />
      )}
      {(!play || blocked) && (
        <button className="btn" onClick={(e) => { e.stopPropagation(); if (!play) setPlay(true); else tryPlay(); }} style={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)", background: "rgba(0,0,0,.6)", color: "#fff", borderColor: "transparent", zIndex: 2 }}>Play movement</button>
      )}
    </div>
  );
}
