import type { Metadata } from "next";
import { ButtonLink, Container, Fig } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false },
};

export default async function OrderReceivedPage({
  searchParams,
}: PageProps<"/checkout/received">) {
  const params = await searchParams;
  const raw = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const reference = raw?.trim() || null;

  return (
    <Container>
      <div className="py-16 sm:py-24">
        <Fig>Order received</Fig>
        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.3rem,5.6vw,4rem)] leading-[1.04] tracking-[-0.022em]">
          Got it. We&apos;ll call to confirm.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[1rem] leading-[1.7] text-muted">
          Your order is with the counter. Online card payment isn&apos;t switched on yet, so
          we&apos;ll ring you to arrange transfer or payment on delivery, and confirm stock before
          anything ships.
        </p>

        {reference ? (
          <div className="mt-8 inline-block border border-line bg-sheet px-6 py-4">
            <p className="vc-fig text-muted">Your reference</p>
            <p className="mt-1.5 font-mono text-2xl tracking-tight tabular-nums">{reference}</p>
          </div>
        ) : null}

        <dl className="mt-10 grid max-w-[60ch] gap-3 border-t border-line pt-6 text-[0.92rem]">
          <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-3">
            <dt className="text-muted">Quote a reference by phone</dt>
            <dd>
              <a href={SITE.phoneHref} className="font-semibold hover:text-live">
                {SITE.phone}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-3">
            <dt className="text-muted">Or email the counter</dt>
            <dd>
              <a href={`mailto:${SITE.email}`} className="font-semibold hover:text-live">
                {SITE.email}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-9 flex flex-wrap gap-4">
          <ButtonLink href="/shop">Keep shopping</ButtonLink>
          <ButtonLink href="/" variant="underline">
            Back to the front page →
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
