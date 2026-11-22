import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, CalendarDays, Dumbbell, User } from "lucide-react";
import { db } from "./db/db";
import { dropLearningPhase, ensureSeeded } from "./db/settings";
import { isStandalone, requestPersist } from "./lib/platform";
import { Today } from "./screens/Today";
import { Journal } from "./screens/Journal";
import { Library } from "./screens/Library";
import { Me } from "./screens/Me";
import { Onboarding } from "./screens/Onboarding";
import { Player, MiniPlayer } from "./player/Player";
import { animateClose, animateOpen, useDragToClose } from "./player/layerMotion";
import { AppContext, type PlayerState, type Tab } from "./state";
import { scrollTop } from "./lib/scroll";

const TABS: { id: Tab; label: string; Icon: typeof Dumbbell }[] = [
  { id: "today", label: "Today", Icon: Dumbbell },
  { id: "journal", label: "Journal", Icon: CalendarDays },
  { id: "library", label: "Library", Icon: BookOpen },
  { id: "me", label: "Me", Icon: User },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [player, setPlayerRaw] = useState<PlayerState>({ open: false });
  // Player motion (src/player/layerMotion.ts): up from the bottom on Start, out of the pill from the
  // mini-player, back into the pill on minimise (chevron or swipe down).
  const layerRef = useRef<HTMLDivElement>(null);
  const openFrom = useRef<"bottom" | "pill">("bottom");
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const playerRef = useRef(player);
  playerRef.current = player;
  const close = (p: PlayerState, dy = 0) => {
    if (closingRef.current) return;
    const el = layerRef.current;
    if (!el) return setPlayerRaw(p);
    closingRef.current = true;
    setClosing(true);
    void animateClose(el, dy).then(() => { closingRef.current = false; setClosing(false); setPlayerRaw(p); });
  };
  const setPlayer = (p: PlayerState, from?: "pill") => {
    const cur = playerRef.current;
    if (cur.open && !p.open) return close(p);
    if (!cur.open && p.open) openFrom.current = from ?? "bottom";
    setPlayerRaw(p);
  };
  useLayoutEffect(() => {
    if (player.open && layerRef.current) animateOpen(layerRef.current, openFrom.current);
  }, [player.open]);
  useDragToClose(layerRef, player.open && !closing, (dy) => close({ ...playerRef.current, open: false } as PlayerState, dy));
  const settings = useLiveQuery(() => db.settings.get("me"));
  const active = useLiveQuery(() => db.sessions.where("status").equals("active").first());

  useEffect(() => {
    ensureSeeded().then(() => dropLearningPhase()).then(() => setReady(true));
    if (isStandalone()) {
      void requestPersist().then((state) => db.meta.put({ key: "persist", value: { state, at: new Date().toISOString() } }));
    }
  }, []);

  // iOS tints the status-bar area (and its top blur) from the page background: dark while the player covers the screen.
  const covering = player.open && !closing;
  useEffect(() => {
    document.documentElement.style.background = covering ? "#0e0e0e" : "";
    document.body.style.background = covering ? "#0e0e0e" : "";
  }, [covering]);

  useEffect(() => {
    document.documentElement.dataset.text = settings?.textSize ?? "normal";
  }, [settings?.textSize]);

  if (!ready || !settings) return null;

  // The pill stays mounted under the open player, so it can grow out of it and shrink back into it.
  const hasMini = !!active || (player.kind === "stretch" && !!player.startedAt);
  const screen = { today: Today, journal: Journal, library: Library, me: Me }[tab];
  const Screen = screen;
  // While the player covers the tabs, they can't be reached (taps, VoiceOver, keyboard).
  const behind = player.open ? ({ inert: "", "aria-hidden": true } as Record<string, unknown>) : {};

  return (
    <AppContext.Provider value={{ settings, tab, setTab, player, setPlayer, activeSession: active ?? null }}>
      {!settings.onboarded ? (
        <Onboarding />
      ) : (
        <>
          <div className="scroller" id="main" {...behind}>
            <main className={`screen${hasMini ? " with-mini" : ""}`}>
              <Screen />
            </main>
          </div>
          {hasMini && <MiniPlayer inert={player.open} />}
          <nav className="tabbar" aria-label="Main" {...behind}>
            <span className="glide" aria-hidden style={{ transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)` }} />
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); scrollTop(); }}>
                <Icon size={24} strokeWidth={1.8} aria-hidden />
                {label}
              </button>
            ))}
          </nav>
          {/* The player slides up over the tabs (they stay mounted underneath, so there is never a blank frame). */}
          {player.open && (
            <div id="player" ref={layerRef} data-mode="gym" className={`player-layer${closing ? " out" : ""}`}><Player /></div>
          )}
        </>
      )}
    </AppContext.Provider>
  );
}
