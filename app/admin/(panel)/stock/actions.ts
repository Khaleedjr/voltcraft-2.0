"use server";

import { updateTag } from "next/cache";
import { done, explain, fail, type ActionResult } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/admin/auth";
import { adjustStock, MANUAL_REASONS, receiveStock, setStockCount, type ManualReason } from "@/lib/admin/stock";
import { PRODUCTS_TAG } from "@/lib/catalogue-data";
import { isSupabaseConfigured } from "@/lib/supabase";

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const MAX_QTY = 100_000;

function wholeNumber(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").replace(/[,\s]/g, "");
  return /^\d+$/.test(s) ? Number(s) : null;
}

/** Add or remove with a reason, or set the count outright (a stocktake). */
export async function adjustStockAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return fail("The database is not connected.");

  const productId = String(fd.get("productId") ?? "");
  if (!isUuid(productId)) return fail("Choose a product.", { productId: "Choose a product." });
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  const mode = fd.get("mode") === "set" ? "set" : "adjust";

  if (mode === "set") {
    const level = wholeNumber(fd.get("qty"));
    if (level === null || level > MAX_QTY) return fail("Enter the count on the shelf.", { qty: "A whole number, zero or more." });
    try {
      const now = await setStockCount({ productId, level, note: note || "Stocktake", actor: admin.email });
      updateTag(PRODUCTS_TAG);
      return done(`Counted: ${now} on the shelf.`);
    } catch (error) {
      return fail(explain(error));
    }
  }

  const reason = String(fd.get("reason") ?? "") as ManualReason;
  if (!(MANUAL_REASONS as readonly string[]).includes(reason)) return fail("Choose a reason.", { reason: "Choose a reason." });
  const qty = wholeNumber(fd.get("qty"));
  if (!qty || qty > MAX_QTY) return fail("Enter how many.", { qty: "A whole number above zero." });
  if (reason === "adjustment" && !note) {
    return fail("Say why — an adjustment without a note is a mystery next month.", { note: "Add a short note." });
  }

  // Deliveries and returns come in; damage goes out; an adjustment goes the way it is told.
  const sign = reason === "damage" ? -1 : reason === "adjustment" && fd.get("direction") === "remove" ? -1 : 1;
  try {
    const now = await adjustStock({ productId, delta: sign * qty, reason, note, actor: admin.email });
    updateTag(PRODUCTS_TAG);
    return done(`${sign > 0 ? "Added" : "Removed"} ${qty}. ${now} on the shelf now.`);
  } catch (error) {
    return fail(explain(error));
  }
}

/** A delivery: many lines, all or nothing. */
export async function receiveDeliveryAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return fail("The database is not connected.");

  const ids = fd.getAll("lineProduct").map(String);
  const qtys = fd.getAll("lineQty");
  const merged = new Map<string, number>();
  let bad = false;
  ids.forEach((id, i) => {
    const raw = String(qtys[i] ?? "").trim();
    if (!id && !raw) return; // an empty row
    const qty = wholeNumber(raw);
    if (!isUuid(id) || !qty || qty > MAX_QTY) {
      bad = true;
      return;
    }
    merged.set(id, (merged.get(id) ?? 0) + qty);
  });
  if (bad) return fail("Every line needs a product and a quantity above zero.", { lines: "Check each line." });
  if (merged.size === 0) return fail("Add at least one line.", { lines: "Add at least one line." });

  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  const lines = [...merged].map(([productId, qty]) => ({ productId, qty }));
  try {
    await receiveStock({ lines, note: note || "Delivery received", actor: admin.email });
    updateTag(PRODUCTS_TAG);
    const units = lines.reduce((n, l) => n + l.qty, 0);
    return done(`Received ${units} unit${units === 1 ? "" : "s"} across ${lines.length} line${lines.length === 1 ? "" : "s"}.`);
  } catch (error) {
    return fail(explain(error, "Nothing was received — the delivery is recorded all at once or not at all."));
  }
}
