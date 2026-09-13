export type Theme = "light" | "dark";

const STORAGE_KEY = "vc-theme";
const listeners = new Set<() => void>();
let snapshot: Theme = "light";
let started = false;

function compute(): Theme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function refresh() {
  const next = compute();
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    snapshot = compute();
    // The OS preference can change while the page is open.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", refresh);
  } else {
    refresh();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): Theme {
  return snapshot;
}

/** The server has no way to know the viewer's theme; light is the base palette. */
export function getThemeServerSnapshot(): Theme {
  return "light";
}

export function toggleTheme() {
  const next: Theme = compute() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage blocked — the choice just will not persist across reloads.
  }
  refresh();
}
