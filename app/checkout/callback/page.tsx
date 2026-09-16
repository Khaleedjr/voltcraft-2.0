import type { Metadata } from "next";
import { ClearCart } from "@/components/clear-cart";
import { ButtonLink, Container, Fig } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { SITE } from "@/lib/site";
import { isOrderStoreConfigured, settleOrder } from "@/lib/order-store";
import { isPaystackConfigured, verifyTransaction, type VerifyResult } from "@/lib/paystack";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

// Paystack redirects here with the reference; the status is only ever taken
// from a server-side verify call, never from the query string.
//
// This page is a courtesy, not the record. The webhook is what actually decides
// whether an order was paid, because it runs whether or not the customer's
// browser ever comes back. Settling here too just means a customer who does
// come straight back sees the right thing without waiting on the webhook —
// settleOrder is idempotent, so whichever arrives first wins.
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || null;
}

export default async function PaymentCallbackPage({
  searchParams,
}: PageProps<"/checkout/callback">) {
  const params = await searchParams;
  const reference = first(params.reference) ?? first(params.trxref);

  let result: VerifyResult | null = null;
  let failure: string | null = null;

  if (!reference) {
    failure = "No payment reference came back from Paystack.";
  } else if (!isPaystackConfigured()) {
    failure = "Payments are not configured on this deployment.";
  } else {
    try {
      result = await verifyTransaction(reference);
      if (isOrderStoreConfigured()) {
        await settleOrder({
          reference,
          paid: result.status === "success",
          amountPaid: result.amount,
          channel: result.channel,
          paidAt: result.paidAt,
        });
      }
    } catch (error) {
      // The customer has still paid; the webhook will record it. Do not tell
      // them anything went wrong with their money.
      console.error("[checkout] callback settle failed", reference, error);
      if (!result) failure = "We couldn't confirm the payment with Paystack just now.";
    }
  }

  const paid = result?.status === "success";

  return (
    <Container>
      <div className="py-16 sm:py-24">
        {paid ? <ClearCart /> : null}

        <Fig>{paid ? "Payment confirmed" : "Payment status"}</Fig>
        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(1.95rem,4.6vw,3.2rem)] leading-[1.07] tracking-[-0.022em]">
          {paid ? "Paid. We're packing it." : "We couldn't confirm that payment."}
        </h1>
        <p className="mt-6 max-w-[54ch] text-[1rem] leading-[1.7] text-muted">
          {paid ? (
            <>
              A receipt is on its way to{" "}
              {result?.customerEmail ? (
                <span className="text-ink">{result.customerEmail}</span>
              ) : (
                "your email"
              )}
              . Orders paid before 2pm on a working day go out the same day.
            </>
          ) : (
            <>
              {failure ??
                "Paystack reported the transaction did not complete. Nothing has been charged twice — check your bank app before retrying."}{" "}
              Quote your reference and we&apos;ll sort it out on the phone.
            </>
          )}
        </p>

        {reference ? (
          <div className="mt-8 inline-block border border-line bg-sheet px-6 py-4">
            <p className="vc-fig text-muted">Reference</p>
            <p className="mt-1.5 font-mono text-2xl tracking-tight tabular-nums">{reference}</p>
            {paid && result ? (
              <p className="mt-2 text-[0.88rem] text-muted tabular-nums">
                {formatNaira(result.amount)}
                {result.channel ? ` · paid by ${result.channel}` : null}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-4">
          {paid ? (
            <>
              <ButtonLink href="/shop">Keep shopping</ButtonLink>
              <ButtonLink href="/" variant="underline">
                Back to the front page →
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/cart">Back to the cart</ButtonLink>
              <a
                href={SITE.phoneHref}
                className="inline-flex items-center gap-2 border-b border-ink px-1 py-2 text-[0.9rem] font-semibold hover:border-live hover:text-live"
              >
                Call {SITE.phone} →
              </a>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
