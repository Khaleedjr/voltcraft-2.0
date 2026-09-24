import "server-only";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Admin sign-in.
 *
 * Accounts come from the environment, not the database, so there is no
 * sign-up page to attack and no password table to leak:
 *
 *   ADMIN_ACCOUNTS=owner@voltcraft.org.ng:s1.<salt>.<hash>,staff@…:s1.…
 *   ADMIN_SESSION_SECRET=<at least 32 random characters>
 *
 * Generate an account line with `node scripts/admin-password.mjs <email>`.
 * Passwords are hashed with scrypt; the plain password is never stored.
 *
 * A session is a signed cookie: the email, an expiry, and a fingerprint of the
 * account's current password hash. Changing someone's password therefore ends
 * every session they have open, and rotating ADMIN_SESSION_SECRET ends
 * everyone's. The cookie is httpOnly, SameSite=strict, and scoped to /admin so
 * the shop never sees it.
 *
 * Checking the session happens in every admin page and every server action —
 * proxy.ts only redirects early, it is not what keeps anyone out.
 */

export const SESSION_COOKIE = "vc_admin";
const SESSION_HOURS = 12;

// scrypt at N=2^15, r=8, p=1: ~32 MiB and tens of milliseconds per attempt —
// cheap for a person signing in, expensive for someone guessing.
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const KEY_LENGTH = 32;
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: typeof SCRYPT,
) => Promise<Buffer>;

export type AdminAccount = { email: string; name: string; hash: string };
export type AdminSession = { email: string; name: string };

function displayName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

function accounts(): AdminAccount[] {
  const raw = process.env.ADMIN_ACCOUNTS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const at = entry.lastIndexOf(":");
      if (at <= 0) return [];
      const email = entry.slice(0, at).trim().toLowerCase();
      const hash = entry.slice(at + 1).trim();
      if (!email.includes("@") || !/^s1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(hash)) return [];
      return [{ email, name: displayName(email), hash }];
    });
}

function secret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET ?? "";
  return value.length >= 32 ? value : null;
}

/** Whether anyone can sign in on this deployment at all. */
export function isAdminConfigured(): boolean {
  return accounts().length > 0 && secret() !== null;
}

// ---------------------------------------------------------------- passwords

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT);
  return `s1.${salt.toString("base64url")}.${key.toString("base64url")}`;
}

async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const [, saltB64, keyB64] = stored.split(".");
  if (!saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64url");
  const actual = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, SCRYPT);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Hashed once, so a sign-in attempt for an unknown email costs the same as a real one. */
let decoy: Promise<string> | null = null;

export async function verifyCredentials(email: string, password: string): Promise<AdminAccount | null> {
  const account = accounts().find((a) => a.email === email.trim().toLowerCase());
  if (!account) {
    decoy ??= hashPassword(randomBytes(12).toString("hex"));
    await passwordMatches(password, await decoy);
    return null;
  }
  return (await passwordMatches(password, account.hash)) ? account : null;
}

// ------------------------------------------------------------------ sessions

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("base64url");
}

/** Changes whenever the account's password does. */
function fingerprint(account: AdminAccount, key: string): string {
  return sign(`pw:${account.hash}`, key).slice(0, 16);
}

type Payload = { e: string; exp: number; fp: string };

function readToken(token: string): AdminSession | null {
  const key = secret();
  if (!key) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;

  // The account must still exist, with the same password it had at sign-in.
  const account = accounts().find((a) => a.email === payload.e);
  if (!account || fingerprint(account, key) !== payload.fp) return null;
  return { email: account.email, name: account.name };
}

export async function createSession(account: AdminAccount): Promise<void> {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET is not set (or is shorter than 32 characters)");
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const body = Buffer.from(JSON.stringify({ e: account.email, exp, fp: fingerprint(account, key) })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${body}.${sign(body, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/admin", maxAge: 0 });
}

/** The signed-in admin, or null. Checked once per request however often it is asked. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? readToken(token) : null;
});

/**
 * The gate. Every admin page and every admin server action calls this first.
 * With no valid session it redirects to sign-in — from a page render and from
 * an action alike, since redirect() works in both.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

// --------------------------------------------------------------- rate limits
//
// Per server instance, in memory. On a single long-running server that is a
// real limit; on serverless it still slows a guesser down per instance, and
// the scrypt cost does the rest.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 5;
const MAX_PER_IP = 20;
const failures = new Map<string, number[]>();

function recent(key: string): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  const list = (failures.get(key) ?? []).filter((t) => t > cutoff);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Minutes until another attempt is allowed, or 0 if one is allowed now. */
export function lockoutMinutes(ip: string, email: string): number {
  const perAccount = recent(`a:${ip}:${email}`);
  const perIp = recent(`i:${ip}`);
  const blocking =
    perAccount.length >= MAX_PER_ACCOUNT ? perAccount : perIp.length >= MAX_PER_IP ? perIp : null;
  if (!blocking) return 0;
  return Math.max(1, Math.ceil((blocking[0]! + WINDOW_MS - Date.now()) / 60000));
}

export function recordFailure(ip: string, email: string): void {
  for (const key of [`a:${ip}:${email}`, `i:${ip}`]) failures.set(key, [...recent(key), Date.now()]);
}

export function clearFailures(ip: string, email: string): void {
  failures.delete(`a:${ip}:${email}`);
}

/** Only ever send someone back inside the admin — never to another site. */
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || value.includes("\\") || value.startsWith("//")) return "/admin";
  if (value === "/admin" || value.startsWith("/admin/") || value.startsWith("/admin?")) return value;
  return "/admin";
}
