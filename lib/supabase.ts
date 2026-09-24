import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one database connection the app has, shared by orders, products, stock
 * and the admin.
 *
 * Configure with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The service-role
 * key bypasses row-level security, so it is server-only and must never be
 * exposed to the browser — hence no NEXT_PUBLIC_ prefix, and the "server-only"
 * import above, which turns a stray client import into a build error.
 *
 * When the keys are absent, isSupabaseConfigured() says so and every caller
 * degrades: the shop serves the bundled catalogue, checkout places orders for
 * manual follow-up, and the admin explains what to set up.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  cached ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** PostgREST returns at most 1,000 rows per request on Supabase. */
export const PAGE_SIZE_LIMIT = 1000;

/**
 * Read every row of a query, a page at a time. The caller builds the query
 * for a given range; this walks the ranges until a short page comes back.
 */
export async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  { limit = 50_000 }: { limit?: number } = {},
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < limit; from += PAGE_SIZE_LIMIT) {
    const { data, error } = await page(from, from + PAGE_SIZE_LIMIT - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE_LIMIT) break;
  }
  return rows;
}
