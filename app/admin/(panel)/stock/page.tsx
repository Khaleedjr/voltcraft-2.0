import type { Metadata } from "next";
import Link from "next/link";
import { StockBadge } from "@/components/admin/badges";
import { AutoSubmitSelect } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { MovementsTable } from "@/components/admin/movements-table";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { AdjustForm, ReceiveForm } from "@/components/admin/stock-forms";
import { EmptyState, field, LinkButton, Notice, PageHeader, Pagination, Panel, Stat, table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatCount } from "@/lib/admin/format";
import { getAdminProduct, inventoryValue, listCountedProducts, listStockAlerts } from "@/lib/admin/products";
import { cleanSearch } from "@/lib/admin/search";
import { isReason, listMovements, movementTotals, REASONS } from "@/lib/admin/stock";
import { hrefWith, pageParam, param } from "@/lib/admin/url";
import { isCatalogueImported } from "@/lib/catalogue-data";
import { formatNaira } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage({ searchParams }: PageProps<"/admin/stock">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Stock" />;
  if (!(await isCatalogueImported())) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Stock" />
        <Notice title="Import the catalogue first" action={<LinkButton href="/admin/products" variant="primary">Go to products</LinkButton>}>
          Stock is kept per product, so the catalogue has to be in the database before anything can be counted.
        </Notice>
      </div>
    );
  }

  const sp = await searchParams;
  const productParam = param(sp.product);
  const reasonRaw = param(sp.reason);
  const reason = reasonRaw && isReason(reasonRaw) ? reasonRaw : undefined;
  const dirRaw = param(sp.direction);
  const direction = dirRaw === "in" || dirRaw === "out" ? dirRaw : undefined;
  const q = cleanSearch(sp.q);
  const page = pageParam(sp.page);

  const [counted, alerts, value, totals, ledger, focus] = await Promise.all([
    listCountedProducts(),
    listStockAlerts(40),
    inventoryValue(),
    movementTotals(30),
    listMovements({ productId: productParam, reason, direction, q, page, perPage: 25 }),
    productParam ? getAdminProduct(productParam) : Promise.resolve(null),
  ]);
  const current = { product: focus ? productParam : undefined, reason, direction, q: q || undefined };
  const low = alerts.filter((a) => a.stockState === "low").length;
  const out = alerts.filter((a) => a.stockState === "out").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Stock"
        description="What is on the shelf, what is running low, and every change to it — who made it and why."
        actions={
          <LinkButton href="#receive" variant="primary">
            <Icon.Import className="size-4" /> Receive a delivery
          </LinkButton>
        }
      />

      <Panel>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="On the shelf" value={formatCount(value.units)} note={`units across ${value.counted} counted lines`} />
          <Stat label="Shelf value" value={formatNaira(value.value)} note="at selling price" />
          <Stat label="Running low" value={<span className={low ? "text-live" : ""}>{low}</span>} note="at or under their alert" />
          <Stat label="Out of stock" value={<span className={out ? "text-warn" : ""}>{out}</span>} note="lines customers can't buy" />
          <Stat label="Received, 30 days" value={`+${formatCount(totals.restock.units)}`} note={`over ${totals.restock.lines} restock line${totals.restock.lines === 1 ? "" : "s"}`} />
          <Stat label="Sold, 30 days" value={formatCount(Math.abs(totals.sale.units))} note={totals.damage.units ? `${Math.abs(totals.damage.units)} written off` : "none written off"} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:items-start">
        <Panel title="Needs restocking" flush aside={<span className="text-[0.8rem] text-faint">{alerts.length} line{alerts.length === 1 ? "" : "s"}</span>}>
          {alerts.length ? (
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[520px]`}>
                <thead>
                  <tr>
                    <th className={table.th}>Product</th>
                    <th className={table.th}>State</th>
                    <th className={table.thRight}>Alert at</th>
                    <th className={table.th}>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((p) => (
                    <tr key={p.id} className={table.tr}>
                      <td className={table.td}>
                        <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-live">
                          {p.name}
                        </Link>
                        {p.sku ? <p className="font-mono text-[0.72rem] text-faint">{p.sku}</p> : null}
                      </td>
                      <td className={table.td}>
                        <StockBadge state={p.stockState} stock={p.stock} inStock={p.inStock} />
                      </td>
                      <td className={table.tdRight}>{p.stock == null ? "—" : p.lowStockAt}</td>
                      <td className={`${table.td} text-right`}>
                        {p.stock != null ? (
                          <Link href={hrefWith("/admin/stock", {}, { product: p.id }) + "#adjust"} className="whitespace-nowrap text-[0.84rem] font-semibold text-live hover:underline">
                            Restock →
                          </Link>
                        ) : (
                          <Link href={`/admin/products/${p.id}`} className="whitespace-nowrap text-[0.84rem] text-muted hover:text-live">
                            Edit →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<Icon.Check />} title="Nothing is running low">
              Every counted line is above its alert level.
            </EmptyState>
          )}
        </Panel>

        <div id="adjust" className="scroll-mt-24">
          <Panel title="Adjust or count">
            {counted.length ? (
              <AdjustForm products={counted} initialProductId={focus?.stock != null ? focus.id : undefined} />
            ) : (
              <p className="text-[0.88rem] text-muted">No product is being counted yet. Tick “Count this product’s stock” on a product to start.</p>
            )}
          </Panel>
        </div>
      </div>

      <div id="receive" className="scroll-mt-24">
        <Panel title="Receive a delivery">
          <p className="mb-4 max-w-[70ch] text-[0.88rem] leading-relaxed text-muted">
            Everything in one box, recorded together: either every line is added or none is. Only counted products are
            listed — switch counting on from a product’s page to receive it here.
          </p>
          {counted.length ? <ReceiveForm products={counted} /> : null}
        </Panel>
      </div>

      <Panel title="Stock ledger" flush aside={<span className="text-[0.8rem] text-faint">{formatCount(ledger.total)} entries</span>}>
        <form method="get" className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3" role="search">
          {current.product ? <input type="hidden" name="product" value={current.product} /> : null}
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search the ledger</span>
            <Icon.Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input name="q" defaultValue={q} placeholder="Product, note, order or person" className={`${field.input} pl-9`} />
          </label>
          <AutoSubmitSelect name="reason" defaultValue={reason ?? ""} aria-label="Reason" className={`${field.select} sm:w-48`}>
            <option value="">Every reason</option>
            {Object.entries(REASONS).map(([key, r]) => (
              <option key={key} value={key}>
                {r.label}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="direction" defaultValue={direction ?? ""} aria-label="Direction" className={`${field.select} sm:w-36`}>
            <option value="">In and out</option>
            <option value="in">Coming in</option>
            <option value="out">Going out</option>
          </AutoSubmitSelect>
          <button type="submit" className="sr-only">
            Filter
          </button>
          {focus ? (
            <Link href={hrefWith("/admin/stock", { ...current, product: undefined })} className="inline-flex items-center gap-1.5 border border-line bg-sheet px-2.5 py-1.5 text-[0.8rem]">
              {focus.name} <Icon.Close className="size-3.5 text-faint" />
              <span className="sr-only">Show every product</span>
            </Link>
          ) : null}
        </form>
        {ledger.rows.length ? (
          <MovementsTable rows={ledger.rows} />
        ) : (
          <EmptyState title="No entries match">Try another reason, or clear the search.</EmptyState>
        )}
        <Pagination
          page={ledger.page}
          pageCount={ledger.pageCount}
          total={ledger.total}
          noun="entries"
          hrefFor={(n) => hrefWith("/admin/stock", current, { page: n === 1 ? null : n })}
        />
      </Panel>
    </div>
  );
}
