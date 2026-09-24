import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductStatusBadge, StockBadge } from "@/components/admin/badges";
import { ConfirmAction } from "@/components/admin/client";
import { Icon } from "@/components/admin/icons";
import { MovementsTable } from "@/components/admin/movements-table";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { ProductEditor } from "@/components/admin/product-editor";
import { EmptyState, LinkButton, Notice, PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatRelative } from "@/lib/admin/format";
import { getAdminProduct } from "@/lib/admin/products";
import { listMovements } from "@/lib/admin/stock";
import { param } from "@/lib/admin/url";
import { isSupabaseConfigured } from "@/lib/supabase";
import { changeProductStatus, deleteProduct, duplicateProductAction } from "../actions";

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  if (!isSupabaseConfigured()) return { title: "Product" };
  const product = await getAdminProduct((await params).id).catch(() => null);
  return { title: product?.name ?? "Product" };
}

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Product" />;

  const { id } = await params;
  const sp = await searchParams;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const history = await listMovements({ productId: product.id, perPage: 12 });
  const trashed = product.status === "archived";

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ProductStatusBadge status={product.status} />
            <StockBadge state={product.stockState} stock={product.stock} inStock={product.inStock} />
            <span className="text-faint">Edited {formatRelative(product.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            {product.status === "active" ? (
              <LinkButton href={`/product/${product.slug}`} target="_blank">
                <Icon.External className="size-4" /> View in shop
              </LinkButton>
            ) : null}
            <ConfirmAction
              action={duplicateProductAction}
              fields={{ id: product.id }}
              tone="primary"
              triggerVariant="secondary"
              size="md"
              trigger={
                <>
                  <Icon.Copy className="size-4" /> Duplicate
                </>
              }
              title="Make a copy?"
              body="Everything is copied except the SKU and the stock count. The copy starts as a hidden draft, so nothing appears in the shop until you publish it."
              confirmLabel="Make a copy"
            />
          </>
        }
      />

      {param(sp.created) ? <Notice tone="done" title="Product created.">{product.status === "active" ? "It is live in the shop now." : "It is saved as a draft — publish it when it is ready."}</Notice> : null}
      {param(sp.duplicated) ? <Notice tone="done" title="This is the copy.">Give it its own name and web address, then publish it.</Notice> : null}
      {trashed ? (
        <Notice
          tone="warn"
          title="This product is in the trash."
          action={
            <div className="flex flex-wrap gap-2">
              <ConfirmAction
                action={changeProductStatus}
                fields={{ ids: product.id, status: "draft" }}
                tone="primary"
                triggerVariant="secondary"
                trigger={
                  <>
                    <Icon.Restore className="size-4" /> Restore
                  </>
                }
                title="Restore this product?"
                body="It comes back as a draft, so it stays hidden until you publish it."
                confirmLabel="Restore as draft"
              />
              <ConfirmAction
                action={deleteProduct}
                fields={{ id: product.id, from: "editor" }}
                trigger={
                  <>
                    <Icon.Trash className="size-4" /> Delete for good
                  </>
                }
                title={`Delete ${product.name} for good?`}
                body="It cannot be brought back. Orders that included it keep their own record of it, and its stock history stays in the ledger under its name."
                confirmLabel="Delete for good"
              />
            </div>
          }
        >
          It is not in the shop. Restore it to edit and publish it again.
        </Notice>
      ) : null}

      <ProductEditor product={product} canUpload />

      <Panel
        title="Stock history"
        flush
        aside={
          history.total > history.rows.length ? (
            <Link href={`/admin/stock?product=${product.id}`} className="text-[0.82rem] font-semibold text-live hover:underline">
              All {history.total} entries →
            </Link>
          ) : null
        }
      >
        {history.rows.length ? (
          <MovementsTable rows={history.rows} showProduct={false} />
        ) : (
          <EmptyState title="No stock movements yet">
            {product.stock == null
              ? "This product's stock is not counted. Tick “Count this product's stock” to start a ledger for it."
              : "Deliveries, sales and corrections will be listed here."}
          </EmptyState>
        )}
      </Panel>

      {!trashed ? (
        <Panel title="Remove from the shop">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[60ch] text-[0.88rem] leading-relaxed text-muted">
              Moving it to the trash takes it out of the shop straight away. Nothing is lost: it can be restored from the
              trash, and past orders keep their record of it.
            </p>
            <ConfirmAction
              action={changeProductStatus}
              fields={{ ids: product.id, status: "archived" }}
              trigger={
                <>
                  <Icon.Trash className="size-4" /> Move to trash
                </>
              }
              title={`Move ${product.name} to the trash?`}
              body="It leaves the shop immediately, and any carts holding it will drop it. You can restore it from the trash."
              confirmLabel="Move to trash"
              size="md"
            />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
