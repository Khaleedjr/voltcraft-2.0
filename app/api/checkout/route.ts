import { NextResponse } from "next/server";
import { toKobo } from "@/lib/format";
import {
  createOrderReference,
  parseCustomer,
  parseLines,
  priceOrder,
} from "@/lib/orders";
import { initializeTransaction, isPaystackConfigured } from "@/lib/paystack";

/**
 * Starts a checkout.
 *
 * The browser sends slugs and quantities only — never prices. The total is
 * recomputed here from the catalogue, so a tampered cart cannot change what
 * gets charged.
 *
 * TODO(voltcraft): orders are currently logged, not persisted. Write the priced
 * order to a database here (and again in a Paystack webhook handler) before
 * taking real money.
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

  const order = priceOrder(parseLines(payload.lines));
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
    lines: order.items.map((i) => ({
      sku: i.product.sku,
      slug: i.product.slug,
      name: i.product.name,
      qty: i.qty,
      unitPrice: i.product.price,
      lineTotal: i.lineTotal,
    })),
    subtotal: order.subtotal,
    delivery: order.delivery,
    total: order.total,
  };
  console.info("[checkout] order placed", JSON.stringify(summary));

  if (!isPaystackConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "manual" as const,
      reference,
      total: order.total,
    });
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
