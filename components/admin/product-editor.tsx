"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ActionForm, FieldError, FormStatus, SubmitButton, useFieldError } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { Thumb } from "@/components/admin/thumb";
import { btnClass, field, Panel } from "@/components/admin/ui";
import { saveProduct, uploadImage } from "@/app/admin/(panel)/products/actions";
import type { AdminProduct } from "@/lib/admin/products";
import { getCategories, type CategorySlug } from "@/lib/catalogue";
import { slugify } from "@/lib/slug";

/**
 * Add or edit a product. One form, submitted to saveProduct; the server
 * checks everything again and answers field by field.
 *
 * The dynamic parts (photos, specification rows, options, aisles) are held
 * in state and written into the form as named inputs, so what is submitted is
 * exactly what is on screen, in order.
 */

type Row = { key: number; a: string; b: string };
let rowSeq = 0;
const newRow = (a = "", b = ""): Row => ({ key: ++rowSeq, a, b });

// --------------------------------------------------------------- small parts

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className={field.label}>
      {children}
      {optional ? <span className="ml-1.5 font-normal text-faint">optional</span> : null}
    </label>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  hint,
  optional,
  prefix,
  inputMode,
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  prefix?: string;
  inputMode?: "numeric" | "text";
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  maxLength?: number;
}) {
  const id = useId();
  const error = useFieldError(name);
  const control = (
    <input
      id={id}
      name={name}
      {...(value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) } : { defaultValue })}
      inputMode={inputMode}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={error ? true : undefined}
      aria-describedby={hint ? `${id}-hint` : undefined}
      className={`${field.input} ${prefix ? "pl-8" : ""}`}
    />
  );
  return (
    <div>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      {prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.9rem] text-faint">{prefix}</span>
          {control}
        </div>
      ) : (
        control
      )}
      {hint ? (
        <p id={`${id}-hint`} className={field.hint}>
          {hint}
        </p>
      ) : null}
      <FieldError name={name} />
    </div>
  );
}

function PairRows({
  rows,
  setRows,
  nameA,
  nameB,
  labelA,
  labelB,
  placeholderA,
  placeholderB,
  addLabel,
  errorName,
  bNumeric,
}: {
  rows: Row[];
  setRows: (rows: Row[]) => void;
  nameA: string;
  nameB: string;
  labelA: string;
  labelB: string;
  placeholderA: string;
  placeholderB: string;
  addLabel: string;
  errorName: string;
  bNumeric?: boolean;
}) {
  const update = (key: number, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  return (
    <div>
      {rows.length ? (
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_1fr_2.5rem] gap-2 text-[0.76rem] text-faint">
            <span>{labelA}</span>
            <span>{labelB}</span>
          </div>
          {rows.map((r) => (
            <div key={r.key} className="grid grid-cols-[1fr_1fr_2.5rem] gap-2">
              <input
                name={nameA}
                value={r.a}
                onChange={(e) => update(r.key, { a: e.target.value })}
                placeholder={placeholderA}
                aria-label={labelA}
                className={field.input}
              />
              <input
                name={nameB}
                value={r.b}
                onChange={(e) => update(r.key, { b: e.target.value })}
                placeholder={placeholderB}
                aria-label={labelB}
                inputMode={bNumeric ? "numeric" : undefined}
                className={field.input}
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                className="grid h-10 place-items-center border border-line text-faint hover:border-warn hover:text-warn"
                aria-label={`Remove ${r.a || "this row"}`}
              >
                <Icon.Close className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => setRows([...rows, newRow()])} className={btnClass("ghost", "sm", "mt-2 -ml-3")}>
        <Icon.Plus className="size-4" /> {addLabel}
      </button>
      <FieldError name={errorName} />
    </div>
  );
}

// ------------------------------------------------------------------- photos

/** Shrink a photo in the browser before it is sent: faster on mobile data, lighter in the shop. */
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file; // keep any animation
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (blob && blob.type === "image/webp" && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
    }
  } catch {
    // A format this browser cannot decode: send the original and let the server judge it.
  }
  return file;
}

function Photos({
  images,
  setImages,
  canUpload,
  name,
}: {
  images: string[];
  setImages: (next: string[] | ((prev: string[]) => string[])) => void;
  canUpload: boolean;
  name: string;
}) {
  const [busy, setBusy] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setProblem(null);
    const list = [...files].slice(0, 12);
    setBusy((n) => n + list.length);
    for (const original of list) {
      const file = await prepareImage(original);
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd).catch(() => ({ ok: false as const, error: "The upload was interrupted." }));
      if (result.ok) setImages((prev) => [...prev, result.url]);
      else setProblem(`${original.name}: ${result.error}`);
      setBusy((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, by: number) => {
    const next = [...images];
    const [item] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, item!);
    setImages(next);
  };

  return (
    <div>
      {images.map((src) => (
        <input key={src} type="hidden" name={name} value={src} />
      ))}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <li key={src} className="border border-line bg-sheet p-2">
            <div className="grid aspect-square place-items-center bg-white">
              <Thumb src={src} alt={`Photo ${i + 1}`} size={128} fill />
            </div>
            <div className="mt-2 flex items-center justify-between gap-1">
              {i === 0 ? (
                <span className="vc-fig pl-1 text-live">Main</span>
              ) : (
                <button
                  type="button"
                  onClick={() => move(i, -i)}
                  className="grid size-7 place-items-center text-faint hover:text-live"
                  aria-label={`Make photo ${i + 1} the main photo`}
                  title="Make this the main photo"
                >
                  <span aria-hidden className="text-[1rem] leading-none">☆</span>
                </button>
              )}
              <span className="flex">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-7 place-items-center text-faint hover:text-ink disabled:opacity-30" aria-label="Move earlier">
                  <Icon.ChevronLeft className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="grid size-7 place-items-center text-faint hover:text-ink disabled:opacity-30" aria-label="Move later">
                  <Icon.ChevronRight className="size-4" />
                </button>
                <button type="button" onClick={() => setImages(images.filter((x) => x !== src))} className="grid size-7 place-items-center text-faint hover:text-warn" aria-label={`Remove photo ${i + 1}`}>
                  <Icon.Trash className="size-4" />
                </button>
              </span>
            </div>
          </li>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <li key={`busy-${i}`} className="grid aspect-square place-items-center border border-dashed border-line text-[0.8rem] text-faint">
            Uploading…
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canUpload ? (
          <label className={btnClass("secondary", "md", "cursor-pointer")}>
            <Icon.Upload className="size-4" /> Upload photos
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              className="sr-only"
              onChange={(e) => void upload(e.target.files)}
            />
          </label>
        ) : null}
        <div className="flex min-w-[240px] flex-1 gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="…or paste a link to a photo"
            aria-label="Photo link"
            className={field.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.click();
              }
            }}
          />
          <button
            type="button"
            className={btnClass("secondary", "md")}
            onClick={() => {
              const url = link.trim();
              if (!/^https?:\/\//.test(url)) return setProblem("That link should start with https://");
              if (!images.includes(url)) setImages([...images, url]);
              setLink("");
              setProblem(null);
            }}
          >
            Add
          </button>
        </div>
      </div>
      <p className={field.hint}>
        The first photo is the one on the shop floor. Photos are resized in your browser before upload.
      </p>
      {problem ? (
        <p className={field.error} role="alert">
          {problem}
        </p>
      ) : null}
      <FieldError name="images" />
    </div>
  );
}

// -------------------------------------------------------------------- aisles

/** Rendered inside the form, so it can read the form's field errors. */
function AislePicker({
  primary,
  also,
  onPrimary,
  onAlso,
}: {
  primary: CategorySlug | "";
  also: CategorySlug[];
  onPrimary: (c: CategorySlug) => void;
  onAlso: (next: CategorySlug[]) => void;
}) {
  const categories = getCategories();
  const error = useFieldError("categories");
  return (
    <Panel title="Aisles">
      <div className="grid gap-4">
        <div>
          <label htmlFor="primary-aisle" className={field.label}>
            Filed under
          </label>
          <select
            id="primary-aisle"
            value={primary}
            onChange={(e) => onPrimary(e.target.value as CategorySlug)}
            aria-invalid={error ? true : undefined}
            className={field.select}
          >
            <option value="">Choose an aisle…</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError name="categories" />
        </div>
        <fieldset>
          <legend className={field.label}>Also list it in</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {categories
              .filter((c) => c.slug !== primary)
              .map((c) => (
                <label key={c.slug} className="flex items-center gap-2 text-[0.85rem]">
                  <input
                    type="checkbox"
                    checked={also.includes(c.slug)}
                    onChange={(e) => onAlso(e.target.checked ? [...also, c.slug] : also.filter((x) => x !== c.slug))}
                    className={field.check}
                  />
                  {c.name}
                </label>
              ))}
          </div>
        </fieldset>
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------- editor

export function ProductEditor({ product, canUpload }: { product: AdminProduct | null; canUpload: boolean }) {
  const isNew = product === null;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs] = useState<Row[]>(() => (product?.specs ?? []).map((s) => newRow(s.label, s.value)));
  const [variants, setVariants] = useState<Row[]>(() =>
    (product?.variants ?? []).map((v) => newRow(v.label, String(v.price))),
  );
  const [primary, setPrimary] = useState<CategorySlug | "">(product?.categories[0] ?? "");
  const [also, setAlso] = useState<CategorySlug[]>(product?.categories.slice(1) ?? []);
  const [tracked, setTracked] = useState(isNew ? true : product.stock != null);
  const [dirty, setDirty] = useState(false);

  // Leaving with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const shownSlug = slugTouched ? slug : slugify(name);
  const orderedCategories = primary ? [primary, ...also.filter((c) => c !== primary)] : also;
  const slugChanged = !isNew && shownSlug !== product.slug;

  return (
    <ActionForm
      action={saveProduct}
      message="none"
      onChange={() => setDirty(true)}
      onResult={(r) => r.ok && setDirty(false)}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {orderedCategories.map((c) => (
        <input key={c} type="hidden" name="categories" value={c} />
      ))}

      <div className="grid min-w-0 gap-6">
        <Panel title="Basics">
          <div className="grid gap-4">
            <TextField name="name" label="Name" value={name} onChange={(v) => { setName(v); setDirty(true); }} placeholder="e.g. HC-SR04 Ultrasonic Sensor" maxLength={200} />
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <TextField
                name="slug"
                label="Web address"
                prefix="/"
                value={shownSlug}
                onChange={(v) => {
                  setSlugTouched(true);
                  setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
                hint={
                  slugChanged ? (
                    <span className="text-warn">Changing this breaks links to the old address, including any in search results.</span>
                  ) : (
                    <>voltcraft.org.ng/product/{shownSlug || "…"}</>
                  )
                }
              />
              <TextField name="sku" label="SKU" defaultValue={product?.sku} optional maxLength={64} />
            </div>
          </div>
        </Panel>

        <Panel title="Photos">
          <Photos images={images} setImages={(next) => { setImages(next); setDirty(true); }} canUpload={canUpload} name="images" />
        </Panel>

        <Panel title="Description">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="summary" optional>
                Summary
              </Label>
              <textarea id="summary" name="summary" rows={2} maxLength={400} defaultValue={product?.summary} placeholder="One or two lines for the top of the product page." className={field.textarea} />
              <FieldError name="summary" />
            </div>
            <div>
              <Label htmlFor="description" optional>
                Full description
              </Label>
              <textarea id="description" name="description" rows={9} defaultValue={product?.description.join("\n\n")} placeholder="What it is, what it's for, what's in the pack." className={field.textarea} />
              <p className={field.hint}>Leave a blank line between paragraphs.</p>
              <FieldError name="description" />
            </div>
          </div>
        </Panel>

        <Panel title="Specifications">
          <PairRows
            rows={specs}
            setRows={(r) => { setSpecs(r); setDirty(true); }}
            nameA="specLabel"
            nameB="specValue"
            labelA="Specification"
            labelB="Value"
            placeholderA="Operating voltage"
            placeholderB="5 V DC"
            addLabel="Add a specification"
            errorName="specs"
          />
        </Panel>

        <Panel title="Options">
          <p className="mb-3 text-[0.85rem] leading-relaxed text-muted">
            For products sold in sizes or packs. The shop lists the price above as “from”, so make it the cheapest option.
          </p>
          <PairRows
            rows={variants}
            setRows={(r) => { setVariants(r); setDirty(true); }}
            nameA="variantLabel"
            nameB="variantPrice"
            labelA="Option"
            labelB="Price (₦)"
            placeholderA="Pack of 40"
            placeholderB="2500"
            addLabel="Add an option"
            errorName="variants"
            bNumeric
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel title="Publish">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Visibility</legend>
            {[
              { v: "active", label: "Live in the shop", hint: "Customers can find and buy it." },
              { v: "draft", label: "Draft", hint: "Hidden until you publish it." },
            ].map((o) => (
              <label key={o.v} className="flex cursor-pointer gap-3 border border-line p-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10">
                <input type="radio" name="status" value={o.v} defaultChecked={(product?.status === "draft" ? "draft" : "active") === o.v} className={`${field.check} mt-0.5`} />
                <span>
                  <span className="block text-[0.88rem] font-semibold">{o.label}</span>
                  <span className="block text-[0.78rem] text-faint">{o.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="mt-3 flex items-center gap-2.5 text-[0.88rem]">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className={field.check} />
            Feature it on the front page
          </label>
          <div className="mt-4 grid gap-2">
            <SubmitButton pendingLabel="Saving…" className="w-full">
              {isNew ? "Create product" : "Save changes"}
            </SubmitButton>
            {product?.status === "active" ? (
              <Link href={`/product/${product.slug}`} target="_blank" className={btnClass("ghost", "sm", "w-full")}>
                View in the shop <Icon.External className="size-3.5" />
              </Link>
            ) : null}
          </div>
          <FormStatus />
          {dirty ? <p className="mt-2 text-center text-[0.76rem] text-faint">Unsaved changes</p> : null}
        </Panel>

        <Panel title="Price">
          <div className="grid gap-4">
            <TextField name="price" label="Price" prefix="₦" inputMode="numeric" defaultValue={product ? String(product.price) : ""} placeholder="0" />
            <TextField
              name="compareAt"
              label="Was-price"
              prefix="₦"
              inputMode="numeric"
              optional
              defaultValue={product?.compareAt != null ? String(product.compareAt) : ""}
              hint="Set it above the price to show the product as discounted."
            />
          </div>
        </Panel>

        <Panel title="Stock">
          <label className="flex items-center gap-2.5 text-[0.88rem] font-semibold">
            <input type="checkbox" name="trackStock" checked={tracked} onChange={(e) => setTracked(e.target.checked)} className={field.check} />
            Count this product’s stock
          </label>
          {tracked ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <TextField name="stock" label="On the shelf" inputMode="numeric" defaultValue={product?.stock != null ? String(product.stock) : "0"} />
              <TextField name="lowStockAt" label="Low at" inputMode="numeric" defaultValue={String(product?.lowStockAt ?? 5)} />
              <p className={`${field.hint} col-span-2 mt-0`}>
                {isNew
                  ? "The opening count goes into the stock ledger."
                  : "Editing the count records a stocktake in the ledger. For deliveries and write-offs, adjust it with a reason instead."}
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <input type="hidden" name="lowStockAt" value={String(product?.lowStockAt ?? 5)} />
              <label className="flex items-center gap-2.5 text-[0.88rem]">
                <input type="checkbox" name="inStock" defaultChecked={product?.inStock ?? true} className={field.check} />
                Available to order
              </label>
              <p className={field.hint}>Without a count, customers can order up to 20 at a time.</p>
            </div>
          )}
          {product && tracked ? (
            <Link href={`/admin/stock?product=${product.id}#adjust`} className="mt-3 inline-block text-[0.84rem] font-semibold text-live hover:underline">
              Adjust with a reason →
            </Link>
          ) : null}
        </Panel>

        <AislePicker
          primary={primary}
          also={also}
          onPrimary={(c) => { setPrimary(c); setDirty(true); }}
          onAlso={(next) => { setAlso(next); setDirty(true); }}
        />

        <Panel title="Tags">
          <TextField name="tags" label="Search tags" optional defaultValue={product?.tags.join(", ")} placeholder="arduino, 5v, beginner" hint="Comma-separated. Shoppers’ searches match these." />
        </Panel>
      </div>
    </ActionForm>
  );
}
