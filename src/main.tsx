import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
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
