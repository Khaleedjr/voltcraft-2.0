"use client";

import { useId } from "react";
import { ActionForm, FieldError, SubmitButton } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { btnClass, field } from "@/components/admin/ui";
import { recordPaymentAction, saveNoteAction, setFulfilmentAction } from "@/app/admin/(panel)/orders/actions";
import type { Fulfilment, PaymentStatus } from "@/components/admin/badges";

const STEPS: { key: Fulfilment; label: string }[] = [
  { key: "unfulfilled", label: "To pack" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export function FulfilmentForm({
  reference,
  fulfilment,
  tracking,
  paid,
}: {
  reference: string;
  fulfilment: Fulfilment;
  tracking: string | null;
  paid: boolean;
}) {
  const trackingId = useId();
  const at = STEPS.findIndex((s) => s.key === fulfilment);
  const next = STEPS[at + 1];

  return (
    <ActionForm action={setFulfilmentAction} className="grid gap-4">
      <input type="hidden" name="reference" value={reference} />
      <ol className="grid grid-cols-4 gap-1" aria-label="Fulfilment progress">
        {STEPS.map((s, i) => (
          <li key={s.key} aria-current={i === at ? "step" : undefined} className="grid gap-1.5">
            <span className={`h-1.5 ${i <= at ? "bg-gold" : "bg-line-soft"}`} />
            <span className={`text-[0.72rem] ${i === at ? "font-semibold text-ink" : i < at ? "text-muted" : "text-faint"}`}>{s.label}</span>
          </li>
        ))}
      </ol>

      {!paid && fulfilment === "unfulfilled" ? (
        <p className="border-l-2 border-gold pl-3 text-[0.82rem] leading-relaxed text-muted">
          Not paid yet. Pack it only if the customer is paying on delivery.
        </p>
      ) : null}

      {fulfilment !== "delivered" ? (
        <div>
          <label htmlFor={trackingId} className={field.label}>
            Courier and tracking <span className="font-normal text-faint">optional</span>
          </label>
          <input id={trackingId} name="tracking" defaultValue={tracking ?? ""} maxLength={120} placeholder="e.g. GIG Logistics 5512 9981" className={field.input} />
        </div>
      ) : tracking ? (
        <p className="text-[0.84rem] text-muted">
          <Icon.Truck className="mr-1.5 inline size-4 align-[-3px]" />
          {tracking}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {next ? (
          <SubmitButton name="fulfilment" value={next.key} pendingLabel="Saving…">
            Mark {next.label.toLowerCase()}
          </SubmitButton>
        ) : (
          <p className="flex items-center gap-2 text-[0.86rem] font-semibold text-earth">
            <Icon.Check className="size-4" /> Delivered — nothing left to do
          </p>
        )}
        {fulfilment === "shipped" ? (
          <SubmitButton name="fulfilment" value="shipped" variant="secondary" pendingLabel="Saving…">
            Update tracking
          </SubmitButton>
        ) : null}
        {at > 0 ? (
          <SubmitButton name="fulfilment" value={STEPS[at - 1]!.key} variant="ghost" size="md" pendingLabel="Saving…">
            Back to {STEPS[at - 1]!.label.toLowerCase()}
          </SubmitButton>
        ) : null}
      </div>
    </ActionForm>
  );
}

export function PaymentForm({
  reference,
  status,
  total,
  paidAmount,
  paidChannel,
}: {
  reference: string;
  status: PaymentStatus;
  total: number;
  paidAmount: number | null;
  paidChannel: string | null;
}) {
  const ids = { amount: useId(), channel: useId(), note: useId() };
  const accepting = status === "mismatch";
  return (
    <ActionForm action={recordPaymentAction} className="grid gap-3">
      <input type="hidden" name="reference" value={reference} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={ids.amount} className={field.label}>
            Amount received
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">₦</span>
            <input id={ids.amount} name="amount" inputMode="numeric" defaultValue={String(accepting && paidAmount ? paidAmount : total)} className={`${field.input} pl-8`} />
          </div>
          <FieldError name="amount" />
        </div>
        <div>
          <label htmlFor={ids.channel} className={field.label}>
            Paid by
          </label>
          <select id={ids.channel} name="channel" defaultValue={accepting ? (paidChannel === "card" ? "card" : "transfer") : "transfer"} className={field.select}>
            <option value="transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
          <FieldError name="channel" />
        </div>
      </div>
      <div>
        <label htmlFor={ids.note} className={field.label}>
          Note <span className="font-normal text-faint">optional</span>
        </label>
        <input id={ids.note} name="note" maxLength={300} placeholder={accepting ? "Why it is fine to ship" : "e.g. GTBank ref 004411"} className={field.input} />
      </div>
      <SubmitButton pendingLabel="Recording…">{accepting ? "Accept this payment" : "Record payment"}</SubmitButton>
      <p className="text-[0.76rem] leading-relaxed text-faint">
        This marks the order paid and takes its stock off the shelf.
      </p>
    </ActionForm>
  );
}

export function NoteForm({ reference, note }: { reference: string; note: string | null }) {
  const id = useId();
  return (
    <ActionForm action={saveNoteAction} className="grid gap-2">
      <input type="hidden" name="reference" value={reference} />
      <label htmlFor={id} className="sr-only">
        Internal note
      </label>
      <textarea id={id} name="note" rows={3} maxLength={2000} defaultValue={note ?? ""} placeholder="Only staff see this." className={field.textarea} />
      <div>
        <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
          Save note
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={btnClass("secondary", "md")}>
      <Icon.Note className="size-4" /> Packing slip
    </button>
  );
}
