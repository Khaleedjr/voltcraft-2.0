import type { Metadata } from "next";
import { Container, Fig, Section } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { SITE } from "@/lib/site";

/*
 * TODO(voltcraft): these are draft policies written to a sensible default, not
 * VoltCraft's actual commitments. Confirm every figure — zones, timings, the
 * returns window and the warranty terms — before this page goes live.
 */

export const metadata: Metadata = {
  title: "Delivery & returns",
  description:
    "Dispatch times, delivery estimates across Nigeria, the free delivery threshold, and how returns and warranty claims work.",
};

const ZONES = [
  { zone: "Lagos mainland & island", time: "Same day – 24 hours", note: "Dispatch rider" },
  { zone: "Ibadan, Abeokuta, Benin", time: "24 – 48 hours", note: "Courier" },
  { zone: "Abuja, Port Harcourt, Enugu", time: "48 hours", note: "Courier" },
  { zone: "Kano, Kaduna, Jos, Maiduguri", time: "48 – 72 hours", note: "Courier" },
  { zone: "Everywhere else in Nigeria", time: "2 – 4 working days", note: "Courier or park" },
];

export default function DeliveryPage() {
  return (
    <Container>
      <div className="py-12 sm:py-16">
        <Fig>Delivery &amp; returns</Fig>
        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.3rem,5.6vw,4rem)] leading-[1.04] tracking-[-0.022em]">
          How it gets to you, and what happens if it&apos;s wrong.
        </h1>
        <p className="mt-6 max-w-[56ch] text-[1.02rem] leading-[1.7] text-muted">
          Orders placed before 2pm on a working day are picked and dispatched the same day. Anything
          after that goes out the next morning. Delivery is free once an order passes{" "}
          {formatNaira(SITE.freeDeliveryThreshold)}.
        </p>
      </div>

      <Section>
        <Fig>Table 1 — Delivery estimates</Fig>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.02em]">
          Time from dispatch
        </h2>
        <div className="mt-7 overflow-x-auto border border-line bg-sheet">
          <table className="w-full min-w-[520px] text-[0.92rem]">
            <thead>
              <tr>
                {["Destination", "After dispatch", "Method"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="vc-fig border-b border-line px-5 py-3.5 text-left font-medium text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONES.map((z) => (
                <tr key={z.zone} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3.5 font-semibold">{z.zone}</td>
                  <td className="px-5 py-3.5 tabular-nums text-muted">{z.time}</td>
                  <td className="px-5 py-3.5 text-muted">{z.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-[60ch] text-[0.86rem] leading-relaxed text-muted">
          Estimates are working days and start when the parcel leaves us, not when you place the
          order. We send a tracking reference on dispatch.
        </p>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Fig>Returns</Fig>
            <h2 className="mt-3 font-display text-[1.9rem] leading-tight tracking-[-0.02em]">
              Seven days, unopened or faulty
            </h2>
            <ul className="mt-5 grid gap-3 text-[0.93rem] leading-relaxed text-muted">
              <li className="border-b border-line pb-3">
                Unopened items in their original packaging can be returned within 7 days of
                delivery for a full refund.
              </li>
              <li className="border-b border-line pb-3">
                Faulty items are covered for 30 days — we replace, or refund if we cannot.
              </li>
              <li className="border-b border-line pb-3">
                Components sold as loose or cut lengths, and any part that has been soldered,
                cannot be returned unless it arrived faulty.
              </li>
              <li>
                Return shipping is on us when the fault is ours, and on you when it is a change of
                mind.
              </li>
            </ul>
          </div>
          <div>
            <Fig>Damaged in transit</Fig>
            <h2 className="mt-3 font-display text-[1.9rem] leading-tight tracking-[-0.02em]">
              Tell us within 48 hours
            </h2>
            <p className="mt-5 max-w-[48ch] text-[0.93rem] leading-relaxed text-muted">
              Photograph the parcel before you finish unpacking it and email{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="border-b border-muted hover:border-live hover:text-live"
              >
                {SITE.email}
              </a>{" "}
              with your order reference. Transit damage reported within 48 hours of delivery is
              replaced at no cost.
            </p>
            <p className="mt-4 max-w-[48ch] text-[0.93rem] leading-relaxed text-muted">
              Instruments arrive with a manufacturer warranty; we handle the claim locally so you
              are not shipping anything abroad.
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
