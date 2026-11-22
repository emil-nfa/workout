import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, CalendarDays, Dumbbell, User } from "lucide-react";
import { db } from "./db/db";
import { ensureSeeded } from "./db/settings";
import { isStandalone, requestPersist } from "./lib/platform";
import { Today } from "./screens/Today";
import { Journal } from "./screens/Journal";
import { Library } from "./screens/Library";
import { Me } from "./screens/Me";
import { Onboarding } from "./screens/Onboarding";
import { Player, MiniPlayer } from "./player/Player";
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
  // The player slides up when it opens and back down when it closes or is minimised.
  const [closing, setClosing] = useState(false);
  const setPlayer = (p: PlayerState) => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (player.open && !p.open && !reduce) {
      setClosing(true);
      window.setTimeout(() => { setClosing(false); setPlayerRaw(p); }, 260);
    } else setPlayerRaw(p);
  };
  const settings = useLiveQuery(() => db.settings.get("me"));
  const active = useLiveQuery(() => db.sessions.where("status").equals("active").first());

  useEffect(() => {
    ensureSeeded().then(() => setReady(true));
    if (isStandalone()) {
      void requestPersist().then((state) => db.meta.put({ key: "persist", value: { state, at: new Date().toISOString() } }));
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.text = settings?.textSize ?? "normal";
  }, [settings?.textSize]);

  if (!ready || !settings) return null;

  const hasMini = !player.open && (!!active || player.kind === "stretch");
  const screen = { today: Today, journal: Journal, library: Library, me: Me }[tab];
  const Screen = screen;

  return (
    <AppContext.Provider value={{ settings, tab, setTab, player, setPlayer, activeSession: active ?? null }}>
      {!settings.onboarded ? (
        <Onboarding />
      ) : player.open ? (
        <div className={`player-layer ${closing ? "out" : "in"}`}><Player /></div>
      ) : (
        <>
          <div className="scroller" id="main">
            <main className={`screen${hasMini ? " with-mini" : ""}`}>
              <Screen />
            </main>
          </div>
          {hasMini && <MiniPlayer />}
          <nav className="tabbar" aria-label="Main">
            <span className="glide" aria-hidden style={{ transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)` }} />
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); scrollTop(); }}>
                <Icon size={24} strokeWidth={1.8} aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </>
      )}
    </AppContext.Provider>
  );
}
