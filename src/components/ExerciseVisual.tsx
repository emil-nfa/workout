// The exercise visual: a small still for lists and cards, the looping 3D video for detail views.
// Videos are fetched whole (served from the offline precache) and played from a blob URL: iOS Safari asks for byte
// ranges when it streams a <video>, which a service-worker cache can't answer offline.
import { useEffect, useState } from "react";
import { FIGURE_IDS } from "../figures/ids";

const base = import.meta.env.BASE_URL;
export const hasFigure = (id: string) => FIGURE_IDS.has(id);
export const thumbUrl = (id: string) => `${base}figures3d/${id}-48.png`;
export const posterUrl = (id: string) => `${base}figures3d/${id}.jpg`;
const videoUrl = (id: string) => `${base}figures3d/${id}.mp4`;

const blobCache = new Map<string, Promise<string>>();
function blobUrl(id: string): Promise<string> {
  let p = blobCache.get(id);
  if (!p) {
    p = fetch(videoUrl(id)).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); }).then((b) => URL.createObjectURL(b));
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
  useEffect(() => {
    let alive = true;
    if (play && hasFigure(id)) blobUrl(id).then((u) => alive && setSrc(u)).catch(() => alive && setSrc(null));
    return () => { alive = false; };
  }, [id, play]);
  if (!hasFigure(id)) return null;
  return (
    <div style={{ position: "relative", aspectRatio: "1", width: "100%", maxWidth: 420, margin: "0 auto", borderRadius: 24, overflow: "hidden", background: "#1f1f1f" }}>
      {src && play ? (
        <video src={src} poster={posterUrl(id)} autoPlay loop muted playsInline aria-label={`${name}, looping 3D demonstration`} style={{ width: "100%", height: "100%", display: "block" }} />
      ) : (
        <>
          <img src={posterUrl(id)} alt={`${name}, end position`} style={{ width: "100%", height: "100%", display: "block" }} />
          {!play && (
            <button className="btn" onClick={() => setPlay(true)} style={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)", background: "rgba(0,0,0,.6)", color: "#fff", borderColor: "transparent" }}>Play movement</button>
          )}
        </>
      )}
    </div>
  );
}
