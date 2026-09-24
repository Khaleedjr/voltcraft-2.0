/**
 * Keep a search term to letters, numbers and a few harmless marks. Search
 * terms end up inside PostgREST `or(...)` filters, where commas, brackets and
 * quotes are syntax — so they are removed rather than escaped.
 */
export function cleanSearch(q: string | string[] | undefined): string {
  const value = Array.isArray(q) ? q[0] : q;
  return (value ?? "").replace(/[^\p{L}\p{N}\s\-+#/&'.@]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** A cleaned term as an ilike pattern, quoted so a dot or @ is a character, not syntax. */
export function likePattern(q: string): string {
  return `"*${q.replace(/"/g, "")}*"`;
}
