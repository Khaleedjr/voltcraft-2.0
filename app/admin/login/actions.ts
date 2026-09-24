"use server";

import { redirect } from "next/navigation";
import { fail, type ActionResult } from "@/lib/admin/action-result";
import {
  clearFailures,
  clientIp,
  createSession,
  destroySession,
  isAdminConfigured,
  lockoutMinutes,
  recordFailure,
  safeNext,
  verifyCredentials,
} from "@/lib/admin/auth";

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isAdminConfigured()) return fail("Sign-in is not set up on this deployment yet.");

  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 512);
  if (!email || !password) {
    return fail("Enter your email and password.", {
      ...(email ? {} : { email: "Enter your email." }),
      ...(password ? {} : { password: "Enter your password." }),
    });
  }

  const ip = await clientIp();
  const wait = lockoutMinutes(ip, email);
  if (wait > 0) return fail(`Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.`);

  const account = await verifyCredentials(email, password);
  if (!account) {
    recordFailure(ip, email);
    // One message whichever half was wrong, so the form cannot be used to
    // find out which emails have accounts.
    return fail("That email and password don't match an admin account.");
  }

  clearFailures(ip, email);
  await createSession(account);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
