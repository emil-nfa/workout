import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/newsreader/latin-500.css";
import "@fontsource/newsreader/latin-600.css";
import "./styles/base.css";
import { injectTheme } from "./styles/theme";
import App from "./App";

injectTheme();
// Precache everything so the app opens in the basement with no signal. New versions apply on next launch.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
