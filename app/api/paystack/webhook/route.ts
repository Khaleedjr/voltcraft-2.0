import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isOrderStoreConfigured, settleOrder } from "@/lib/order-store";

/**
 * Paystack webhook — the source of truth for whether an order was paid.
 *
 * The callback page cannot be trusted with this job: it only runs if the
 * customer's browser comes back. On a phone that loses signal mid-payment, or
 * whose owner closes the tab, the money moves and the callback never fires.
 * This does, server to server, whether or not anyone is watching.
 *
 * Point Paystack at https://<your-domain>/api/paystack/webhook
 * (Dashboard → Settings → API Keys & Webhooks).
 *
 * Paystack retries on any non-2xx, so this answers 200 for anything it has
 * genuinely finished with — including events it does not care about. It
 * answers non-2xx only when a retry might actually succeed.
 */

/** Paystack signs the raw body with the secret key, HMAC SHA512. */
function signatureMatches(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  // timingSafeEqual throws on a length mismatch, so check that first
  return a.length === b.length && timingSafeEqual(a, b);
}

type ChargeEvent = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
    amount?: number; // kobo
    paid_at?: string | null;
    paidAt?: string | null;
    channel?: string | null;
  };
};

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[webhook] PAYSTACK_SECRET_KEY is not set — cannot verify signatures");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Must be the exact bytes Paystack signed, so read the body as text and do
  // not let anything parse it first.
  const raw = await request.text();

  if (!signatureMatches(raw, request.headers.get("x-paystack-signature"), secret)) {
    // Anyone can POST here; only Paystack can sign. Say nothing useful.
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: ChargeEvent;
  try {
    event = JSON.parse(raw) as ChargeEvent;
  } catch {
    return NextResponse.json({ ok: true, ignored: "unparseable" });
  }

  const name = event.event ?? "";
  if (name !== "charge.success" && name !== "charge.failed") {
    return NextResponse.json({ ok: true, ignored: name || "unnamed" });
  }

  const reference = event.data?.reference;
  if (!reference) return NextResponse.json({ ok: true, ignored: "no reference" });

  if (!isOrderStoreConfigured()) {
    // Retrying will not help until the deployment is configured, but losing a
    // paid order silently is worse than a noisy retry.
    console.error("[webhook] order store not configured; cannot record", reference);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const kobo = event.data?.amount;
  try {
    const outcome = await settleOrder({
      reference,
      paid: name === "charge.success" && event.data?.status === "success",
      amountPaid: typeof kobo === "number" ? Math.round(kobo / 100) : null,
      channel: event.data?.channel ?? null,
      paidAt: event.data?.paid_at ?? event.data?.paidAt ?? null,
    });

    if (outcome.result === "missing") {
      // A payment for an order we never wrote. Not retryable, but somebody
      // needs to know: the customer has been charged.
      console.error("[webhook] payment for unknown order", reference, event.data);
      return NextResponse.json({ ok: true, ignored: "unknown reference" });
    }
    if (outcome.result === "settled" && outcome.order.status === "mismatch") {
      console.error(
        "[webhook] amount mismatch",
        reference,
        "priced",
        outcome.order.total,
        "paid",
        outcome.order.paidAmount,
      );
    }

    return NextResponse.json({ ok: true, result: outcome.result });
  } catch (error) {
    // A transient database problem — let Paystack retry.
    console.error("[webhook] could not settle", reference, error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
