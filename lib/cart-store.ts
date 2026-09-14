import { getProduct, maxOrderable } from "@/lib/catalogue";

/**
 * The cart lives in a module-level store rather than React state so that
 * `useSyncExternalStore` can read it directly. That keeps the server render and
 * the first client render in agreement, and avoids hydrating through an effect.
 */

const STORAGE_KEY = "vc-cart";

export type CartLine = { slug: string; qty: number };
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
        typeof (l as CartLine).qty === "number" &&
        (l as CartLine).qty > 0 &&
        getProduct((l as CartLine).slug) !== undefined,
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

export function addLine(slug: string, qty = 1) {
  const product = getProduct(slug);
  if (!product) return;
  const ceiling = Math.max(maxOrderable(product), 1);
  const existing = snapshot.lines.find((l) => l.slug === slug);
  const nextQty = Math.min((existing?.qty ?? 0) + qty, ceiling);
  commit(
    existing
      ? snapshot.lines.map((l) => (l.slug === slug ? { ...l, qty: nextQty } : l))
      : [...snapshot.lines, { slug, qty: nextQty }],
  );
}

export function setLineQty(slug: string, qty: number) {
  const product = getProduct(slug);
  if (!product) return;
  if (qty <= 0) {
    commit(snapshot.lines.filter((l) => l.slug !== slug));
    return;
  }
  const capped = Math.min(qty, Math.max(maxOrderable(product), 1));
  commit(snapshot.lines.map((l) => (l.slug === slug ? { ...l, qty: capped } : l)));
}

export function removeLine(slug: string) {
  commit(snapshot.lines.filter((l) => l.slug !== slug));
}

export function clearCart() {
  if (snapshot.lines.length === 0 && snapshot.ready) return;
  commit(EMPTY);
}
