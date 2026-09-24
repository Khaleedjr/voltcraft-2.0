/**
 * Spreadsheet downloads. Names, addresses and notes come from the checkout
 * form, so every cell is defused before it goes into a file: a value starting
 * with = + - or @ would otherwise run as a formula when Excel opens it.
 */

export function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** A CSV download named `voltcraft-<name>.csv`. */
export function csvResponse(name: string, header: string[], rows: unknown[][]): Response {
  // The byte-order mark tells Excel the file is UTF-8, so ₦ and names survive.
  const body = "\uFEFF" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="voltcraft-${name.replace(/[^\w.-]/g, "-")}.csv"`,
      "cache-control": "no-store",
    },
  });
}
