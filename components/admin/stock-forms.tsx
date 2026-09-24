"use client";

import { useId, useState } from "react";
import { ActionForm, FieldError, SubmitButton } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { btnClass, field } from "@/components/admin/ui";
import { adjustStockAction, receiveDeliveryAction } from "@/app/admin/(panel)/stock/actions";

export type CountedProduct = { id: string; name: string; sku: string; stock: number | null };

function ProductSelect({
  products,
  value,
  onChange,
  name,
  id,
  label,
}: {
  products: CountedProduct[];
  value: string;
  onChange: (v: string) => void;
  name: string;
  id?: string;
  label?: string;
}) {
  return (
    <select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={field.select}>
      <option value="">Choose a product…</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} — {p.stock ?? 0} on the shelf
        </option>
      ))}
    </select>
  );
}

const REASON_OPTIONS = [
  { value: "restock", label: "Restock — a delivery came in", sign: 1 },
  { value: "return", label: "Return — a customer brought it back", sign: 1 },
  { value: "damage", label: "Damaged or lost — write it off", sign: -1 },
  { value: "adjustment", label: "Correction — with a note", sign: 0 },
] as const;

export function AdjustForm({ products, initialProductId }: { products: CountedProduct[]; initialProductId?: string }) {
  const ids = { product: useId(), qty: useId(), note: useId(), reason: useId() };
  const [mode, setMode] = useState<"adjust" | "set">("adjust");
  const [productId, setProductId] = useState(products.some((p) => p.id === initialProductId) ? initialProductId! : "");
  const [reason, setReason] = useState<(typeof REASON_OPTIONS)[number]["value"]>("restock");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  const product = products.find((p) => p.id === productId);
  const n = /^\d+$/.test(qty) ? Number(qty) : null;
  const sign = REASON_OPTIONS.find((r) => r.value === reason)!.sign || (direction === "remove" ? -1 : 1);
  const after = product && n !== null ? (mode === "set" ? n : (product.stock ?? 0) + sign * n) : null;

  return (
    <ActionForm
      action={adjustStockAction}
      onResult={(r) => {
        if (r.ok) {
          setQty("");
          setNote("");
        }
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="mode" value={mode} />
      <div className="grid grid-cols-2 border border-line p-0.5" role="radiogroup" aria-label="What are you doing?">
        {(
          [
            ["adjust", "Add or remove"],
            ["set", "Stocktake: set the count"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`px-3 py-2 text-[0.84rem] font-semibold ${mode === m ? "bg-ink text-ground" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={ids.product} className={field.label}>
          Product
        </label>
        <ProductSelect id={ids.product} name="productId" products={products} value={productId} onChange={setProductId} />
        <FieldError name="productId" />
      </div>

      {mode === "adjust" ? (
        <div>
          <label htmlFor={ids.reason} className={field.label}>
            Reason
          </label>
          <select id={ids.reason} name="reason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className={field.select}>
            {REASON_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <FieldError name="reason" />
          {reason === "adjustment" ? (
            <div className="mt-2 flex gap-4 text-[0.86rem]">
              {(["add", "remove"] as const).map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <input type="radio" name="direction" value={d} checked={direction === d} onChange={() => setDirection(d)} className={field.check} />
                  {d === "add" ? "Add" : "Remove"}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <div>
          <label htmlFor={ids.qty} className={field.label}>
            {mode === "set" ? "Counted" : "How many"}
          </label>
          <input id={ids.qty} name="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))} className={field.input} />
          <FieldError name="qty" />
        </div>
        <div>
          <label htmlFor={ids.note} className={field.label}>
            Note {reason === "adjustment" && mode === "adjust" ? null : <span className="font-normal text-faint">optional</span>}
          </label>
          <input
            id={ids.note}
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder={mode === "set" ? "Shelf count, 24 Sept" : reason === "restock" ? "Supplier and invoice number" : "What happened"}
            className={field.input}
          />
          <FieldError name="note" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[0.84rem] tabular-nums text-muted" aria-live="polite">
          {product && after !== null ? (
            <>
              {product.stock ?? 0} → <span className={after < 0 ? "text-warn" : "text-ink"}>{after}</span> on the shelf
              {after < 0 ? " — more than there is" : ""}
            </>
          ) : (
            " "
          )}
        </p>
        <SubmitButton pendingLabel="Saving…" disabled={after !== null && after < 0}>
          {mode === "set" ? "Save the count" : "Record it"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

type Line = { key: number; productId: string; qty: string };
let lineSeq = 0;

export function ReceiveForm({ products }: { products: CountedProduct[] }) {
  const [lines, setLines] = useState<Line[]>(() => [{ key: ++lineSeq, productId: "", qty: "" }]);
  const [note, setNote] = useState("");
  const noteId = useId();
  const units = lines.reduce((n, l) => n + (Number(l.qty) || 0), 0);
  const update = (key: number, patch: Partial<Line>) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <ActionForm
      action={receiveDeliveryAction}
      onResult={(r) => {
        if (r.ok) {
          setLines([{ key: ++lineSeq, productId: "", qty: "" }]);
          setNote("");
        }
      }}
      className="grid gap-4"
    >
      <div className="grid gap-2">
        <div className="grid grid-cols-[1fr_6.5rem_2.5rem] gap-2 text-[0.76rem] text-faint">
          <span>Product</span>
          <span>Quantity</span>
        </div>
        {lines.map((l, i) => (
          <div key={l.key} className="grid grid-cols-[1fr_6.5rem_2.5rem] gap-2">
            <ProductSelect name="lineProduct" label={`Product on line ${i + 1}`} products={products} value={l.productId} onChange={(v) => update(l.key, { productId: v })} />
            <input
              name="lineQty"
              inputMode="numeric"
              value={l.qty}
              onChange={(e) => update(l.key, { qty: e.target.value.replace(/[^\d]/g, "") })}
              aria-label={`Quantity on line ${i + 1}`}
              className={field.input}
            />
            <button
              type="button"
              onClick={() => setLines(lines.length > 1 ? lines.filter((x) => x.key !== l.key) : [{ key: ++lineSeq, productId: "", qty: "" }])}
              className="grid h-10 place-items-center border border-line text-faint hover:border-warn hover:text-warn"
              aria-label={`Remove line ${i + 1}`}
            >
              <Icon.Close className="size-4" />
            </button>
          </div>
        ))}
        <div>
          <button type="button" onClick={() => setLines([...lines, { key: ++lineSeq, productId: "", qty: "" }])} className={btnClass("ghost", "sm", "-ml-3")}>
            <Icon.Plus className="size-4" /> Add a line
          </button>
        </div>
        <FieldError name="lines" />
      </div>
      <div>
        <label htmlFor={noteId} className={field.label}>
          Supplier and invoice <span className="font-normal text-faint">optional</span>
        </label>
        <input id={noteId} name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Shenzhen parts, invoice 2231" className={field.input} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[0.84rem] tabular-nums text-muted">
          {units ? `${units} unit${units === 1 ? "" : "s"} on ${lines.filter((l) => l.productId && Number(l.qty)).length} line(s)` : " "}
        </p>
        <SubmitButton pendingLabel="Receiving…">Receive delivery</SubmitButton>
      </div>
    </ActionForm>
  );
}
