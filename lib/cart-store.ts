/**
 * The cart lives in a module-level store rather than React state so that
 * `useSyncExternalStore` can read it directly. That keeps the server render and
 * the first client render in agreement, and avoids hydrating through an effect.
 *
 * It holds slugs, chosen options and quantities only, and knows nothing about
 * the catalogue:
 * useCart() resolves lines against the products the page was rendered with and
 * passes each line's stock ceiling in. A slug that is no longer on sale simply
 * does not resolve, and drops out of the cart's items.
 */

import { lineKey } from "@/lib/orders";

const STORAGE_KEY = "vc-cart";

/** Which line: a product, and the option chosen if it is sold in options. */
export type LineRef = { slug: string; variant?: string };
export type CartLine = LineRef & { qty: number };
export type CartSnapshot = { lines: CartLine[]; ready: boolean };

/** Stable references — React compares snapshots by identity. */
const EMPTY: CartLine[] = [];
const SERVER_SNAPSHOT: CartSnapshot = { lines: EMPTY, ready: false };

let snapshot: CartSnapshot = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const lines = parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).slug === "string" &&
        ((l as CartLine).variant === undefined || typeof (l as CartLine).variant === "string") &&
        typeof (l as CartLine).qty === "number" &&
        Number.isInteger((l as CartLine).qty) &&
        (l as CartLine).qty > 0,
    );
    return lines.length ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage blocked (private window, cleared site data). The cart still works
    // for this page view, it just will not survive a reload.
  }
}

function commit(lines: CartLine[]) {
  snapshot = { lines, ready: true };
  persist(lines);
  emit();
}

/** Called the first time a component subscribes, i.e. on the client only. */
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  snapshot = { lines: readStored(), ready: true };
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): CartSnapshot {
  return snapshot;
}

export function getServerSnapshot(): CartSnapshot {
  return SERVER_SNAPSHOT;
}

/** `ceiling` is the most of this line anyone may hold — the caller knows the stock. */
export function addLine(ref: LineRef, qty: number, ceiling: number) {
  if (ceiling <= 0 || qty <= 0) return;
  const key = lineKey(ref);
  const existing = snapshot.lines.find((l) => lineKey(l) === key);
  const nextQty = Math.min((existing?.qty ?? 0) + qty, ceiling);
  commit(
    existing
      ? snapshot.lines.map((l) => (lineKey(l) === key ? { ...l, qty: nextQty } : l))
      : [...snapshot.lines, { slug: ref.slug, ...(ref.variant ? { variant: ref.variant } : {}), qty: nextQty }],
  );
}

export function setLineQty(ref: LineRef, qty: number, ceiling: number) {
  const key = lineKey(ref);
  if (qty <= 0) {
    commit(snapshot.lines.filter((l) => lineKey(l) !== key));
    return;
  }
  if (ceiling <= 0) return;
  const capped = Math.min(qty, ceiling);
  commit(snapshot.lines.map((l) => (lineKey(l) === key ? { ...l, qty: capped } : l)));
}

export function removeLine(ref: LineRef) {
  const key = lineKey(ref);
  commit(snapshot.lines.filter((l) => lineKey(l) !== key));
}

export function clearCart() {
  if (snapshot.lines.length === 0 && snapshot.ready) return;
  commit(EMPTY);
}
