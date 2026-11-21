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

const TABS: { id: Tab; label: string; Icon: typeof Dumbbell }[] = [
  { id: "today", label: "Today", Icon: Dumbbell },
  { id: "journal", label: "Journal", Icon: CalendarDays },
  { id: "library", label: "Library", Icon: BookOpen },
  { id: "me", label: "Me", Icon: User },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [player, setPlayer] = useState<PlayerState>({ open: false });
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
        <Player />
      ) : (
        <>
          <main className={`screen${hasMini ? " with-mini" : ""}`} id="main">
            <Screen />
          </main>
          {hasMini && <MiniPlayer />}
          <nav className="tabbar" aria-label="Main">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); scrollTo(0, 0); }}>
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
