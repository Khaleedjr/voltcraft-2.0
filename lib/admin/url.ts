/** The first value of a search param. */
export function param(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim() : undefined;
}

/** A page number from a search param: 1 or more. */
export function pageParam(value: string | string[] | undefined): number {
  const n = Number(param(value));
  return Number.isInteger(n) && n > 0 ? Math.min(n, 10_000) : 1;
}

/**
 * The current filters with some changed — empty values dropped, so URLs stay
 * short and the defaults never appear in them.
 */
export function hrefWith(
  path: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | number | undefined | null> = {},
): string {
  const merged: Record<string, string | number | undefined | null> = { ...current, ...changes };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v != null && v !== "") sp.set(k, String(v));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}
