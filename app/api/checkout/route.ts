import { NextResponse } from "next/server";
import { toKobo } from "@/lib/format";
import {
  createOrderReference,
  parseCustomer,
  parseLines,
  priceOrder,
} from "@/lib/orders";
import { getProductsForCheckout } from "@/lib/catalogue-data";
import { createPendingOrder, isOrderStoreConfigured, snapshotLines } from "@/lib/order-store";
import { initializeTransaction, isPaystackConfigured } from "@/lib/paystack";

/**
 * Starts a checkout.
 *
 * The browser sends slugs and quantities only — never prices. The total is
 * recomputed here from the catalogue, read fresh rather than from the cache,
 * so a tampered cart cannot change what gets charged and a price changed in
 * the admin a minute ago is the price that is charged.
 *
 * The priced order is written to the database BEFORE the customer is sent to
 * Paystack, so a payment can never arrive for an order we have no record of.
 * Whether it was actually paid is decided later, by the webhook — see
 * app/api/paystack/webhook/route.ts.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const payload = body as { lines?: unknown; customer?: unknown };
  const customer = parseCustomer(payload.customer);
  if (!customer) {
    return NextResponse.json(
      { ok: false, error: "Please check your delivery details and try again." },
      { status: 400 },
    );
  }

  const lines = parseLines(payload.lines);
  let products;
  try {
    products = await getProductsForCheckout(lines.map((l) => l.slug));
  } catch (error) {
    console.error("[checkout] could not read the catalogue", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't reach the catalogue just now. Please try again or call the counter." },
      { status: 503 },
    );
  }
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const order = priceOrder(lines, (slug) => bySlug.get(slug));
  if (order.items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Your cart is empty, or those items are no longer in stock." },
      { status: 400 },
    );
  }

  const reference = createOrderReference();
  const summary = {
    reference,
    customer,
    lines: snapshotLines(order),
    subtotal: order.subtotal,
    delivery: order.delivery,
    total: order.total,
  };
  if (!isPaystackConfigured()) {
    // No payments configured: record the order if we can, and let the counter
    // follow it up. Nothing is being charged, so logging is an acceptable
    // floor here in a way it would not be once money is moving.
    if (isOrderStoreConfigured()) {
      try {
        await createPendingOrder({ reference, customer, order });
      } catch (error) {
        console.error("[checkout] could not record manual order", error);
      }
    }
    console.info("[checkout] order placed (manual)", JSON.stringify(summary));
    return NextResponse.json({
      ok: true,
      mode: "manual" as const,
      reference,
      total: order.total,
    });
  }

  // Taking money with nowhere to put the order is how a paid order vanishes.
  // Refuse rather than risk it.
  if (!isOrderStoreConfigured()) {
    console.error("[checkout] payments are on but the order store is not configured");
    return NextResponse.json(
      { ok: false, error: "We are not able to take orders right now. Please call the counter." },
      { status: 503 },
    );
  }

  try {
    await createPendingOrder({ reference, customer, order });
  } catch (error) {
    console.error("[checkout] could not record order", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't start the payment. Please try again or call the counter." },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const init = await initializeTransaction({
      email: customer.email,
      amountKobo: toKobo(order.total),
      reference,
      callbackUrl: `${origin}/checkout/callback`,
      metadata: {
        customer_name: customer.name,
        phone: customer.phone,
        address: `${customer.address}, ${customer.city}, ${customer.state}`,
        notes: customer.notes ?? "",
        items: summary.lines,
      },
    });
    return NextResponse.json({
      ok: true,
      mode: "paystack" as const,
      reference: init.reference,
      authorizationUrl: init.authorizationUrl,
    });
  } catch (error) {
    console.error("[checkout] paystack init failed", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't start the payment. Please try again or call the counter." },
      { status: 502 },
    );
  }
}
