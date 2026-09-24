/**
 * What every admin server action returns: done, with an optional message, or
 * failed, with a sentence a person can act on and, for forms, which fields.
 */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function done(message?: string): ActionResult {
  return message ? { ok: true, message } : { ok: true };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

/**
 * The database's functions raise with a readable message after a "name:"
 * prefix (see supabase/schema.sql). Show the readable part; for anything
 * unexpected, say so plainly instead of leaking internals.
 */
export function explain(error: unknown, fallback = "That didn't work. Please try again."): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const readable = message.match(/^(?:could not [^:]+: )?[a-z_]+: (.+)$/)?.[1];
  if (readable) return readable.charAt(0).toUpperCase() + readable.slice(1).replace(/\.?$/, ".");
  if (/duplicate key value.*slug/i.test(message)) return "Another product already uses that URL slug.";
  if (/violates check constraint "products_slug_check"/i.test(message)) {
    return "The URL slug can only contain lowercase letters, numbers and single hyphens.";
  }
  return fallback;
}
