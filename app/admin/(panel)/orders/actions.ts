"use server";

import { refresh, updateTag } from "next/cache";
import type { Fulfilment } from "@/components/admin/badges";
import { done, explain, fail, type ActionResult } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/admin/auth";
import { cancelOrder, recordPayment, saveInternalNote, setFulfilment } from "@/lib/admin/orders";
import { PRODUCTS_TAG } from "@/lib/catalogue-data";
import { isSupabaseConfigured } from "@/lib/supabase";

const isReference = (v: string) => /^[A-Z0-9-]{4,40}$/i.test(v);
const CHANNELS = ["cash", "transfer", "pos", "card", "other"] as const;
const STEPS: Fulfilment[] = ["unfulfilled", "packed", "shipped", "delivered"];

function reference(fd: FormData): string | null {
  const r = String(fd.get("reference") ?? "");
  return isReference(r) ? r : null;
}

/** Cash at the counter, a transfer, POS — or accepting a mismatched payment after checking it. */
export async function recordPaymentAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return fail("The database is not connected.");
  const ref = reference(fd);
  if (!ref) return fail("That order could not be found.");

  const amount = Number(String(fd.get("amount") ?? "").replace(/[₦,\s]/g, ""));
  if (!Number.isInteger(amount) || amount <= 0) return fail("Enter the amount received, in whole naira.", { amount: "Whole naira, above zero." });
  const channel = String(fd.get("channel") ?? "");
  if (!(CHANNELS as readonly string[]).includes(channel)) return fail("How was it paid?", { channel: "Choose how it was paid." });
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);

  try {
    await recordPayment({ reference: ref, amount, channel, note, actor: admin.email });
  } catch (error) {
    return fail(explain(error));
  }
  updateTag(PRODUCTS_TAG); // stock came off the shelf
  return done("Payment recorded. The order is paid and its stock has been taken off the shelf.");
}

export async function setFulfilmentAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return fail("The database is not connected.");
  const ref = reference(fd);
  if (!ref) return fail("That order could not be found.");

  const fulfilment = String(fd.get("fulfilment") ?? "") as Fulfilment;
  if (!STEPS.includes(fulfilment)) return fail("Choose a step.");
  const tracking = String(fd.get("tracking") ?? "").trim().slice(0, 120);

  try {
    await setFulfilment({ reference: ref, fulfilment, tracking, actor: admin.email });
  } catch (error) {
    return fail(explain(error));
  }
  refresh(); // the stepper, the badges, the timeline and the nav's to-pack count all move
  return done(
    fulfilment === "shipped"
      ? `Marked shipped${tracking ? ` — ${tracking}` : ""}.`
      : fulfilment === "delivered"
        ? "Marked delivered."
        : fulfilment === "packed"
          ? "Marked packed."
          : "Moved back to unfulfilled.",
  );
}

export async function cancelOrderAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return fail("The database is not connected.");
  const ref = reference(fd);
  if (!ref) return fail("That order could not be found.");

  const refunded = fd.get("refunded") === "on";
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  try {
    await cancelOrder({ reference: ref, refunded, note, actor: admin.email });
  } catch (error) {
    return fail(explain(error));
  }
  updateTag(PRODUCTS_TAG); // any stock it took is back on the shelf
  return done("Order cancelled.");
}

export async function saveNoteAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return fail("The database is not connected.");
  const ref = reference(fd);
  if (!ref) return fail("That order could not be found.");
  const note = String(fd.get("note") ?? "").trim().slice(0, 2000);
  try {
    await saveInternalNote({ reference: ref, note, actor: admin.email });
  } catch (error) {
    return fail(explain(error));
  }
  refresh(); // the note joins the timeline
  return done(note ? "Note saved." : "Note cleared.");
}
