import type { Metadata } from "next";
import Link from "next/link";
import { ProductStatusBadge, StockBadge } from "@/components/admin/badges";
import { AutoSubmitSelect, BulkForm, ConfirmAction, SelectAll } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { Thumb } from "@/components/admin/thumb";
import { EmptyState, field, FilterTabs, LinkButton, Notice, PageHeader, Pagination, table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatRelative } from "@/lib/admin/format";
import { listProducts, PRODUCT_SORTS, type ProductListParams, type ProductSort } from "@/lib/admin/products";
import { cleanSearch } from "@/lib/admin/search";
import { hrefWith, pageParam, param } from "@/lib/admin/url";
import { getCategories, getCategory, isCategorySlug } from "@/lib/catalogue";
import { BUNDLED_PRODUCTS, isCatalogueImported } from "@/lib/catalogue-data";
import { formatNaira } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { changeProductStatus, importCatalogue } from "./actions";

export const metadata: Metadata = { title: "Products" };

const VIEWS = ["all", "active", "draft", "low", "out", "archived"] as const;
type View = (typeof VIEWS)[number];

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Products" />;

  const sp = await searchParams;
  const viewRaw = param(sp.view);
  const view: View = (VIEWS as readonly string[]).includes(viewRaw ?? "") ? (viewRaw as View) : "all";
  const q = cleanSearch(sp.q);
  const catRaw = param(sp.category);
  const category = catRaw && isCategorySlug(catRaw) ? catRaw : undefined;
  const sortRaw = param(sp.sort);
  const sort: ProductSort = sortRaw && sortRaw in PRODUCT_SORTS ? (sortRaw as ProductSort) : "updated";
  const page = pageParam(sp.page);
  const deleted = param(sp.deleted);

  const current = {
    view: view === "all" ? undefined : view,
    q: q || undefined,
    category,
    sort: sort === "updated" ? undefined : sort,
  };
  const listParams: ProductListParams = { view, q, category, sort, page };
  const [list, imported] = await Promise.all([listProducts(listParams), isCatalogueImported()]);
  const { rows, counts } = list;

  const bulkActions =
    view === "archived"
      ? [
          { status: "draft", label: "Restore as drafts" },
          { status: "delete", label: "Delete for good", variant: "danger" as const, confirm: "Delete {n} product(s) for good? This cannot be undone." },
        ]
      : [
          { status: "active", label: "Publish", variant: "primary" as const },
          { status: "draft", label: "Make draft" },
          { status: "archived", label: "Move to trash", variant: "danger" as const },
        ];

  const filtered = Boolean(q || category);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Products"
        description={
          imported
            ? `${counts.all} in the catalogue, ${counts.active} live in the shop.`
            : "The shop is still running on the catalogue bundled with the site."
        }
        actions={
          imported ? (
            <>
              <LinkButton href="/admin/stock#receive">
                <Icon.Import className="size-4" /> Receive stock
              </LinkButton>
              <LinkButton href="/admin/products/new" variant="primary">
                <Icon.Plus className="size-4" /> New product
              </LinkButton>
            </>
          ) : null
        }
      />

      {!imported ? (
        <Notice
          title={`Import the ${BUNDLED_PRODUCTS.length} bundled products to start managing them here`}
          action={
            <ConfirmAction
              action={importCatalogue}
              fields={{}}
              tone="primary"
              triggerVariant="primary"
              size="md"
              trigger={
                <>
                  <Icon.Import className="size-4" /> Import catalogue
                </>
              }
              title={`Import ${BUNDLED_PRODUCTS.length} products?`}
              body="Every product, price, photo and stock count in the bundled catalogue is copied into the database. From then on the shop reads from the database, and every change you make here is live on the next page view. Counted stock gets an opening entry in the stock ledger."
              confirmLabel="Import"
            />
          }
        >
          Until then the shop shows the built-in list, and there is nothing here to edit.
        </Notice>
      ) : null}

      {deleted ? <Notice tone="done">{deleted} was deleted for good.</Notice> : null}

      {imported ? (
        <div className="min-w-0 border border-line bg-raised">
          <div className="border-b border-line px-2 sm:px-3">
            <FilterTabs
              active={view}
              items={[
                { key: "all", label: "All", count: counts.all, href: hrefWith("/admin/products", current, { view: null, page: null }) },
                { key: "active", label: "Live", count: counts.active, href: hrefWith("/admin/products", current, { view: "active", page: null }) },
                { key: "draft", label: "Drafts", count: counts.draft, href: hrefWith("/admin/products", current, { view: "draft", page: null }) },
                { key: "low", label: "Low stock", count: counts.low, href: hrefWith("/admin/products", current, { view: "low", page: null }) },
                { key: "out", label: "Out of stock", count: counts.out, href: hrefWith("/admin/products", current, { view: "out", page: null }) },
                { key: "archived", label: "Trash", count: counts.archived, href: hrefWith("/admin/products", current, { view: "archived", page: null }) },
              ]}
            />
          </div>

          <form method="get" className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3" role="search">
            {current.view ? <input type="hidden" name="view" value={current.view} /> : null}
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">Search products</span>
              <Icon.Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input name="q" defaultValue={q} placeholder="Search name, SKU or URL" className={`${field.input} pl-9`} />
            </label>
            <label className="w-full sm:w-auto">
              <span className="sr-only">Aisle</span>
              <AutoSubmitSelect name="category" defaultValue={category ?? ""} className={`${field.select} sm:w-48`}>
                <option value="">All aisles</option>
                {getCategories().map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </AutoSubmitSelect>
            </label>
            <label className="w-full sm:w-auto">
              <span className="sr-only">Sort</span>
              <AutoSubmitSelect name="sort" defaultValue={sort} className={`${field.select} sm:w-52`}>
                {Object.entries(PRODUCT_SORTS).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </AutoSubmitSelect>
            </label>
            <button type="submit" className="sr-only">
              Search
            </button>
            {filtered ? (
              <Link href={hrefWith("/admin/products", { view: current.view })} className="px-2 text-[0.84rem] text-muted hover:text-live">
                Clear
              </Link>
            ) : null}
          </form>

          {/* Always mounted: when a bulk action empties the list, its message must not vanish with it. */}
          <BulkForm action={changeProductStatus} actions={bulkActions}>
            {rows.length === 0 ? (
              <EmptyState
              icon={<Icon.Products />}
              title={filtered ? "Nothing matches that search" : view === "archived" ? "The trash is empty" : "No products here yet"}
              action={
                !filtered && view === "all" ? (
                  <LinkButton href="/admin/products/new" variant="primary">
                    <Icon.Plus className="size-4" /> Add the first product
                  </LinkButton>
                ) : null
              }
            >
              {filtered ? "Try a shorter search, or another aisle." : null}
            </EmptyState>
            ) : (
              <div className={table.wrap}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th className={`${table.th} w-10 pr-0`}>
                        <SelectAll />
                      </th>
                      <th className={table.th}>Product</th>
                      <th className={table.th}>Aisle</th>
                      <th className={table.th}>Stock</th>
                      <th className={table.thRight}>Price</th>
                      <th className={table.th}>Status</th>
                      <th className={table.th}>Edited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const aisle = getCategory(p.categories[0] ?? "");
                      return (
                        <tr key={p.id} className={table.tr}>
                          <td className={`${table.td} w-10 pr-0`}>
                            <input type="checkbox" name="ids" value={p.id} aria-label={`Select ${p.name}`} className={field.check} />
                          </td>
                          <td className={table.td}>
                            <div className="flex min-w-[240px] items-center gap-3">
                              <Thumb src={p.images[0]} alt="" />
                              <div className="min-w-0">
                                <Link href={`/admin/products/${p.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-live">
                                  {p.name}
                                  {p.featured ? <span className="ml-1.5 text-live" title="Featured">★</span> : null}
                                </Link>
                                <p className="mt-0.5 truncate font-mono text-[0.72rem] text-faint">
                                  {p.sku ? `${p.sku} · ` : ""}/{p.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={`${table.td} whitespace-nowrap text-muted`}>
                            {aisle?.name ?? "—"}
                            {p.categories.length > 1 ? <span className="text-faint"> +{p.categories.length - 1}</span> : null}
                          </td>
                          <td className={table.td}>
                            <StockBadge state={p.stockState} stock={p.stock} inStock={p.inStock} />
                          </td>
                          <td className={table.tdRight}>
                            {formatNaira(p.price)}
                            {p.compareAt ? <s className="block text-[0.74rem] text-faint">{formatNaira(p.compareAt)}</s> : null}
                          </td>
                          <td className={table.td}>
                            <ProductStatusBadge status={p.status} />
                          </td>
                          <td className={`${table.td} whitespace-nowrap text-[0.82rem] text-faint`}>{formatRelative(p.updatedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </BulkForm>
          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            total={list.total}
            noun={list.total === 1 ? "product" : "products"}
            hrefFor={(n) => hrefWith("/admin/products", current, { page: n === 1 ? null : n })}
          />
        </div>
      ) : null}
    </div>
  );
}
