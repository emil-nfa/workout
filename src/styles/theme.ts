// Turns themes.json into CSS variables.
// Notebook mode = :root (light, or dark when the system is dark, or forced via data-theme).
// Gym mode = any element with [data-mode="gym"] (always dark). The stat card uses .statcard.
import themes from "./themes.json";

type Theme = Record<string, string>;
const vars = (t: Theme) =>
  Object.entries(t)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => `--${k}:${v};`)
    .join("");

export function themeCss(): string {
  const { notebookLight, notebookDark, gym, statCard } = themes as unknown as Record<string, Theme>;
  return [
    `:root{color-scheme:light;${vars(notebookLight)}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;${vars(notebookDark)}}}`,
    `:root[data-theme="dark"]{color-scheme:dark;${vars(notebookDark)}}`,
    `[data-mode="gym"]{color-scheme:dark;${vars(gym)};background:var(--bg);color:var(--ink)}`,
    `.statcard{${vars(statCard)}}`,
  ].join("\n");
}

export function injectTheme(): void {
  const el = document.createElement("style");
  el.id = "theme-tokens";
  el.textContent = themeCss();
  document.head.prepend(el);
}
