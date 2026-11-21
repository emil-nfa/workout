// Browser / iOS capability helpers. Facts behind each choice: research/PLATFORM.md.

/** True when running as an installed Home Screen app (iOS) or any standalone PWA. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export type PersistState = "granted" | "denied" | "unsupported";

/** Asks for persistent storage (P4). Never relied on: backups are the safety net. */
export async function requestPersist(): Promise<PersistState> {
  try {
    if (!navigator.storage?.persist) return "unsupported";
    if (await navigator.storage.persisted?.()) return "granted";
    return (await navigator.storage.persist()) ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { usage: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch {
    return null;
  }
}

// ---------- Screen Wake Lock (P1: works in Home Screen apps from iOS 18.4) ----------
let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function acquire() {
  try {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener?.("release", () => (sentinel = null));
  } catch {
    sentinel = null; // e.g. low battery mode: the timers still work, the screen may just sleep
  }
}

function onVisibility() {
  if (wanted && document.visibilityState === "visible" && !sentinel) void acquire();
}

export async function keepAwake(on: boolean): Promise<void> {
  wanted = on;
  if (on) {
    document.addEventListener("visibilitychange", onVisibility);
    await acquire();
  } else {
    document.removeEventListener("visibilitychange", onVisibility);
    try { await sentinel?.release(); } catch { /* already released */ }
    sentinel = null;
  }
}

// ---------- Saving a file (P3: share sheet if it accepts the file, else a download link) ----------
export type SaveResult = "shared" | "downloaded" | "cancelled";

export async function saveFile(bytes: Uint8Array, name: string, type: string): Promise<SaveResult> {
  const blob = new Blob([bytes], { type });
  const file = new File([blob], name, { type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name });
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled";
      // any other failure: fall through to the download link
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}

export function readFileBytes(f: File): Promise<Uint8Array> {
  return f.arrayBuffer().then((b) => new Uint8Array(b));
}

// ---------- Sound + speech (vibration is not available on iOS: P2) ----------
let audio: AudioContext | null = null;

/** Call from a user gesture once (iOS unlocks audio only after a tap). */
export function unlockAudio(): void {
  try {
    if (!audio) {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (A) audio = new A();
    }
    if (audio?.state === "suspended") void audio.resume();
  } catch { /* no audio */ }
}

export function beep(times = 2): void {
  if (!audio) return;
  for (let i = 0; i < times; i++) {
    const o = audio.createOscillator();
    const g = audio.createGain();
    const t = audio.currentTime + i * 0.28;
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.22);
  }
}

export function say(text: string): void {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch { /* no speech */ }
}
