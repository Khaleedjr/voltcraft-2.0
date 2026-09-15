"use client";

import { useLayoutEffect } from "react";

const KEY = "vc-theme";

type Theme = "light" | "dark";

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Flips the site between the paper drawing sheet and the lamplit one.
 *
 * Both icons are rendered and CSS picks the right one off <html data-theme>,
 * so the button is correct in the server HTML and there is nothing to
 * reconcile at hydration.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  useLayoutEffect(() => {
    // React's Strict Mode remount in development wipes the attribute the inline
    // script set, so put it back. A no-op in production.
    apply(stored() ?? systemTheme());

    // Follow the OS for as long as the visitor has not overridden it themselves.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!stored()) apply(systemTheme());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next: Theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private browsing — the choice just will not survive the tab.
    }
    // Ease the colours across rather than snapping them.
    root.classList.add("vc-theming");
    apply(next);
    window.setTimeout(() => root.classList.remove("vc-theming"), 320);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch colour theme"
      title="Switch colour theme"
      className={`grid size-9 place-items-center border border-line text-muted transition-colors hover:border-ink hover:text-ink ${className}`}
    >
      <Moon className="vc-when-light" />
      <Sun className="vc-when-dark" />
    </button>
  );
}

function Moon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

function Sun({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.35 4.35l1.56 1.56M18.09 18.09l1.56 1.56M2.6 12h2.2M19.2 12h2.2M4.35 19.65l1.56-1.56M18.09 5.91l1.56-1.56" />
    </svg>
  );
}
