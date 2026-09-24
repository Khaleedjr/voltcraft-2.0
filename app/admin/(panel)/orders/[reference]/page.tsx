import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FulfilmentBadge, PaymentBadge } from "@/components/admin/badges";
import { ConfirmAction } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { FulfilmentForm, NoteForm, PaymentForm, PrintButton } from "@/components/admin/order-forms";
import { Thumb } from "@/components/admin/thumb";
import { Detail, LinkButton, Notice, PageHeader, Panel, table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import { getOrderWithEvents, ordersForEmail } from "@/lib/admin/orders";
import { formatNaira } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cancelOrderAction } from "../actions";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[reference]">): Promise<Metadata> {
  return { title: `Order ${(await params).reference}` };
}

const EVENT_DOT: Record<string, string> = {
  placed: "bg-faint",
  paid: "bg-earth",
  payment_recorded: "bg-earth",
  payment_failed: "bg-warn",
  mismatch: "bg-warn",
  fulfilment: "bg-gold",
  cancelled: "bg-warn",
  refunded: "bg-warn",
  stock_applied: "bg-line",
  stock_restored: "bg-line",
  note: "bg-muted",
};

export default async function OrderPage({ params }: PageProps<"/admin/orders/[reference]">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Order" />;

  const { reference } = await params;
  const found = await getOrderWithEvents(decodeURIComponent(reference));
  if (!found) notFound();
  const { order: o, events } = found;
  const history = await ordersForEmail(o.customerEmail, 100);

  const paid = o.status === "paid";
  const cancelled = o.fulfilment === "cancelled";
  const canTakePayment = !cancelled && (o.status === "pending" || o.status === "failed" || o.status === "mismatch");
  const canCancel = !cancelled && o.fulfilment !== "shipped" && o.fulfilment !== "delivered";
  const units = o.items.reduce((n, i) => n + i.qty, 0);
  const lifetime = history.filter((h) => h.status === "paid").reduce((n, h) => n + h.total, 0);
  const onlinePaid = paid && o.paidChannel && !["cash", "transfer", "pos", "other", "manual"].includes(o.paidChannel);

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={<span className="font-mono tracking-[-0.01em]">{o.reference}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PaymentBadge status={o.status} />
            <FulfilmentBadge fulfilment={o.fulfilment} paid={paid} />
            <span className="text-faint">
              Placed {formatDateTime(o.createdAt)} · {formatRelative(o.createdAt)}
            </span>
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <PrintButton />
            {onlinePaid ? (
              <LinkButton href={`https://dashboard.paystack.com/#/search?model=transactions&query=${encodeURIComponent(o.reference)}`} target="_blank" rel="noreferrer">
                <Icon.External className="size-4" /> Paystack
              </LinkButton>
            ) : null}
          </div>
        }
      />

      {o.status === "mismatch" ? (
        <Notice tone="warn" title={`Paid ${formatNaira(o.paidAmount ?? 0)} against a total of ${formatNaira(o.total)}.`}>
          Check the payment in Paystack before anything ships. If it is fine, accept it below; if not, cancel and refund.
        </Notice>
      ) : null}
      {cancelled ? (
        <Notice tone="warn" title={o.status === "refunded" ? "Cancelled and refunded." : "Cancelled."}>
          {o.stockRestoredAt ? "Its stock was put back on the shelf." : "It never took any stock."}
        </Notice>
      ) : null}
      {o.notes ? (
        <Notice title="The customer wrote:">
          <span className="whitespace-pre-line text-ink">“{o.notes}”</span>
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="grid min-w-0 gap-6">
          <Panel title={`Items · ${units} unit${units === 1 ? "" : "s"}`} flush>
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[520px]`}>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={`${i.slug}-${i.name}`} className={table.tr}>
                      <td className={`${table.td} w-14 pr-0`}>
                        <Thumb src={i.image} alt="" size={48} />
                      </td>
                      <td className={table.td}>
                        {i.productId ? (
                          <Link href={`/admin/products/${i.productId}`} className="font-semibold hover:text-live">
                            {i.name}
                          </Link>
                        ) : (
                          <span className="font-semibold">{i.name}</span>
                        )}
                        <p className="font-mono text-[0.72rem] text-faint">{i.sku || i.slug}</p>
                      </td>
                      <td className={`${table.tdRight} text-muted`}>
                        {i.qty} × {formatNaira(i.unitPrice)}
                      </td>
                      <td className={table.tdRight}>{formatNaira(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="grid gap-2 border-t border-line px-4 py-4 text-[0.88rem] sm:px-5">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-mono tabular-nums">{formatNaira(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-mono tabular-nums">{o.delivery ? formatNaira(o.delivery) : "Free"}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line-soft pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-[1.35rem] tabular-nums">{formatNaira(o.total)}</dd>
              </div>
              {o.paidAmount != null ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Paid{o.paidChannel ? ` by ${o.paidChannel}` : ""}</dt>
                  <dd className={`font-mono tabular-nums ${o.paidAmount !== o.total ? "text-warn" : "text-earth"}`}>{formatNaira(o.paidAmount)}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          <Panel title="Timeline" className="print:hidden">
            <ol className="grid gap-0">
              {events.map((e, i) => (
                <li key={e.id} className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-4 last:pb-0">
                  {i < events.length - 1 ? <span className="absolute left-[0.56rem] top-4 bottom-0 w-px bg-line" aria-hidden /> : null}
                  <span className={`relative mt-1.5 size-2.5 rounded-full ${EVENT_DOT[e.kind] ?? "bg-muted"}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[0.88rem] leading-snug">{e.message}</p>
                    <p className="mt-0.5 text-[0.76rem] text-faint">
                      {formatDateTime(e.createdAt)} · {e.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title="Customer">
            <p className="font-semibold">
              <Link href={`/admin/customers/${encodeURIComponent(o.customerEmail.toLowerCase())}`} className="hover:text-live">
                {o.customerName}
              </Link>
            </p>
            <p className="mt-1 text-[0.82rem] text-faint">
              {history.length === 1
                ? "First order"
                : `${history.length} orders · ${formatNaira(lifetime)} paid in all`}
            </p>
            <dl className="mt-4 grid">
              <Detail label="Email">
                <a href={`mailto:${o.customerEmail}?subject=${encodeURIComponent(`Your VoltCraft order ${o.reference}`)}`} className="hover:text-live">
                  {o.customerEmail}
                </a>
              </Detail>
              <Detail label="Phone">
                <a href={`tel:${o.customerPhone.replace(/\s/g, "")}`} className="font-mono text-[0.84rem] hover:text-live">
                  {o.customerPhone}
                </a>
                <a
                  href={whatsappLink(o.customerPhone, `Hello ${o.customerName.split(" ")[0]}, this is VoltCraft about your order ${o.reference}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-3 text-[0.8rem] font-semibold text-earth hover:underline print:hidden"
                >
                  WhatsApp
                </a>
              </Detail>
            </dl>
          </Panel>

          <Panel title="Deliver to">
            <address className="text-[0.92rem] not-italic leading-relaxed">
              {o.customerName}
              <br />
              {o.address}
              <br />
              {o.city}, {o.state}
              <br />
              <span className="font-mono text-[0.84rem]">{o.customerPhone}</span>
            </address>
          </Panel>

          <Panel title="Payment" className="print:hidden">
            <dl className="grid">
              <Detail label="Status">
                <PaymentBadge status={o.status} />
              </Detail>
              {o.paidAt ? <Detail label="Paid">{formatDateTime(o.paidAt)}</Detail> : null}
              {o.paidChannel ? <Detail label="Channel">{o.paidChannel}</Detail> : null}
              <Detail label="Stock">
                {o.stockRestoredAt
                  ? "Taken, then put back"
                  : o.stockAppliedAt
                    ? `Taken off the shelf ${formatRelative(o.stockAppliedAt)}`
                    : "Not taken yet — it is when payment lands"}
              </Detail>
            </dl>
            {canTakePayment ? (
              <div className="mt-4 border-t border-line pt-4">
                <PaymentForm reference={o.reference} status={o.status} total={o.total} paidAmount={o.paidAmount} paidChannel={o.paidChannel} />
              </div>
            ) : null}
          </Panel>

          {!cancelled ? (
            <Panel title="Fulfilment" className="print:hidden">
              <FulfilmentForm reference={o.reference} fulfilment={o.fulfilment} tracking={o.tracking} paid={paid} />
            </Panel>
          ) : null}

          <Panel title="Internal note" className="print:hidden">
            <NoteForm reference={o.reference} note={o.internalNote} />
          </Panel>

          {canCancel ? (
            <Panel title="Cancel" className="print:hidden">
              <p className="mb-3 text-[0.84rem] leading-relaxed text-muted">
                {o.stockAppliedAt ? "Its stock goes back on the shelf. " : ""}
                {paid ? "Refund the customer in Paystack or by transfer first." : "Nothing has been paid, so there is nothing to refund."}
              </p>
              <ConfirmAction
                action={cancelOrderAction}
                fields={{ reference: o.reference }}
                trigger="Cancel this order"
                title={`Cancel ${o.reference}?`}
                body="This cannot be undone. The customer is not told automatically — call or message them."
                confirmLabel="Cancel the order"
              >
                {paid || o.status === "mismatch" ? (
                  <label className="flex items-center gap-2.5 text-[0.88rem]">
                    <input type="checkbox" name="refunded" className="size-4 accent-[var(--vc-live)]" /> The money has been refunded
                  </label>
                ) : null}
                <input name="note" maxLength={300} placeholder="Why (optional)" aria-label="Reason for cancelling" className="h-10 w-full border border-line bg-raised px-3 text-[0.9rem]" />
              </ConfirmAction>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
