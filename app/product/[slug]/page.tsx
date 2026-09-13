import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuy } from "@/components/product-buy";
import { ProductCard } from "@/components/product-card";
import { ProductPlate } from "@/components/product-plate";
import { Container, Fig, StockPill } from "@/components/ui";
import {
  getCategory,
  getProduct,
  getProducts,
  relatedProducts,
  stockLabel,
} from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.summary };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const stock = stockLabel(product.stock);
  const related = relatedProducts(product);
  const freeDelivery = product.price >= SITE.freeDeliveryThreshold;

  return (
    <Container>
      <div className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="vc-fig mb-8 text-faint">
          <Link href="/shop" className="hover:text-live">
            Catalogue
          </Link>
          <span className="px-2">/</span>
          {category ? (
            <>
              <Link href={`/shop/${category.slug}`} className="hover:text-live">
                {category.name}
              </Link>
              <span className="px-2">/</span>
            </>
          ) : null}
          <span className="text-muted">{product.sku}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <ProductPlate
              category={product.category}
              sku={product.sku}
              ratio="aspect-[5/4]"
              className="bg-raised"
            />
            <p className="vc-fig mt-3 text-faint">
              Photography pending — specification below is the source of truth
            </p>
          </div>

          <div>
            <Fig>{category?.name ?? "Catalogue"}</Fig>
            <h1 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.06] tracking-[-0.02em]">
              {product.name}
            </h1>
            <p className="mt-4 max-w-[48ch] text-[1rem] leading-[1.68] text-muted">
              {product.summary}
            </p>

            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="font-display text-[2.6rem] leading-none tracking-[-0.02em] tabular-nums">
                {formatNaira(product.price)}
              </span>
              {product.compareAt ? (
                <span className="text-[0.95rem] text-faint line-through tabular-nums">
                  {formatNaira(product.compareAt)}
                </span>
              ) : null}
              <StockPill text={stock.text} tone={stock.tone} />
            </div>

            <div className="mt-6">
              <ProductBuy slug={product.slug} stock={product.stock} />
            </div>

            <ul className="mt-6 grid gap-2 border-t border-line pt-5 text-[0.86rem] text-muted">
              <li className="flex gap-2.5">
                <span className="text-live" aria-hidden>
                  →
                </span>
                {freeDelivery
                  ? "Free nationwide delivery on this item."
                  : `Free delivery once your order passes ${formatNaira(SITE.freeDeliveryThreshold)}.`}
              </li>
              <li className="flex gap-2.5">
                <span className="text-live" aria-hidden>
                  →
                </span>
                Dispatched the same working day on orders placed before 2pm.
              </li>
              <li className="flex gap-2.5">
                <span className="text-live" aria-hidden>
                  →
                </span>
                Need ten or more?{" "}
                <a
                  href={SITE.quoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border-b border-muted hover:border-live hover:text-live"
                >
                  Ask for a bulk price
                </a>
                .
              </li>
            </ul>
          </div>
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <Fig>Specification</Fig>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.02em]">
              The numbers that decide it
            </h2>
            <p className="mt-4 max-w-[40ch] text-[0.92rem] leading-relaxed text-muted">
              If a rating here is wrong for your build, say so before you order — we would rather
              swap it now than process a return.
            </p>
            {product.tags.length ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((t) => (
                  <li
                    key={t}
                    className="vc-fig border border-line px-2.5 py-1.5 text-muted"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="overflow-x-auto border border-line bg-sheet">
            <table className="w-full min-w-[420px] text-[0.9rem]">
              <caption className="vc-fig border-b border-line px-5 py-3.5 text-left text-muted">
                Table 1 — {product.sku}
              </caption>
              <tbody>
                {product.specs.map((s) => (
                  <tr key={s.label} className="border-b border-line last:border-b-0">
                    <th scope="row" className="w-2/5 px-5 py-3.5 text-left font-semibold">
                      {s.label}
                    </th>
                    <td className="px-5 py-3.5 tabular-nums text-muted">{s.value}</td>
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <th scope="row" className="px-5 py-3.5 text-left font-semibold">
                    In stock
                  </th>
                  <td className="px-5 py-3.5 tabular-nums text-muted">
                    {product.stock} unit{product.stock === 1 ? "" : "s"}, Lagos
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {related.length ? (
          <section className="mt-16 border-t border-line pt-10">
            <Fig>Same aisle</Fig>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.02em]">
              Usually bought alongside
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
