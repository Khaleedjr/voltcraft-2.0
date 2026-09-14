import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuy } from "@/components/product-buy";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { Container, Fig, StockPill } from "@/components/ui";
import {
  getCategory,
  getProduct,
  getProducts,
  maxOrderable,
  primaryCategory,
  priceLabel,
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
  return {
    title: product.name,
    description: product.summary || `${product.name} — in stock at VoltCraft, ${SITE.city}.`,
    openGraph: product.images.length ? { images: [product.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(primaryCategory(product));
  const stock = stockLabel(product);
  const related = relatedProducts(product);
  const from = priceLabel(product);
  const freeDelivery = product.price >= SITE.freeDeliveryThreshold;

  return (
    <Container>
      <div className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="vc-fig mb-8 text-faint">
          <Link href="/shop" className="hover:text-live">
            Catalogue
          </Link>
          {category ? (
            <>
              <span className="px-2">/</span>
              <Link href={`/shop/${category.slug}`} className="hover:text-live">
                {category.name}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <ProductGallery product={product} />

          <div>
            <Fig>{category?.name ?? "Catalogue"}</Fig>
            <h1 className="mt-3 font-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-[1.1] tracking-[-0.02em]">
              {product.name}
            </h1>
            {product.summary ? (
              <p className="mt-4 max-w-[52ch] text-[1rem] leading-[1.68] text-muted">
                {product.summary}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              {from ? <span className="vc-fig text-faint">{from}</span> : null}
              <span className="font-display text-[2.1rem] leading-none tracking-[-0.025em] tabular-nums">
                {formatNaira(product.price)}
              </span>
              {product.compareAt ? (
                <span className="text-[0.95rem] text-faint line-through tabular-nums">
                  {formatNaira(product.compareAt)}
                </span>
              ) : null}
              <StockPill text={stock.text} tone={stock.tone} />
            </div>

            {product.variants ? (
              <div className="mt-6 border border-line bg-sheet">
                <p className="vc-fig border-b border-line px-4 py-2.5 text-muted">Options</p>
                <ul>
                  {product.variants.map((v) => (
                    <li
                      key={v.label}
                      className="flex items-baseline justify-between gap-4 border-b border-line px-4 py-2.5 text-[0.9rem] last:border-b-0"
                    >
                      <span>{v.label}</span>
                      <span className="tabular-nums text-muted">{formatNaira(v.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="px-4 py-2.5 text-[0.8rem] leading-relaxed text-muted">
                  Tell us which you need in the delivery notes at checkout, or{" "}
                  <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="border-b border-muted hover:border-live hover:text-live">
                    message us
                  </a>
                  .
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <ProductBuy slug={product.slug} stock={maxOrderable(product)} />
            </div>

            <ul className="mt-6 grid gap-2 border-t border-line pt-5 text-[0.86rem] text-muted">
              <li className="flex gap-2.5">
                <span className="text-live" aria-hidden>→</span>
                {freeDelivery
                  ? "Free nationwide delivery on this item."
                  : `Free delivery once your order passes ${formatNaira(SITE.freeDeliveryThreshold)}.`}
              </li>
              <li className="flex gap-2.5">
                <span className="text-live" aria-hidden>→</span>
                Dispatched the same working day on orders placed before 2pm.
              </li>
              <li className="flex gap-2.5">
                <span className="text-live" aria-hidden>→</span>
                Buying ten or more?{" "}
                <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="border-b border-muted hover:border-live hover:text-live">
                  Message us on WhatsApp
                </a>
                .
              </li>
            </ul>
          </div>
        </div>

        {product.specs.length || product.description.length ? (
          <section className="mt-14 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <Fig>Specification</Fig>
              <h2 className="mt-3 font-display text-[1.6rem] leading-tight tracking-[-0.022em]">
                The detail
              </h2>
              <p className="mt-4 max-w-[40ch] text-[0.92rem] leading-relaxed text-muted">
                If something here is wrong for your build, say so before you order — we would rather
                swap it now than process a return.
              </p>
              {product.specs.length ? (
                <div className="mt-6 border border-line bg-sheet">
                  <table className="w-full text-[0.9rem]">
                    <tbody>
                      {product.specs.map((s) => (
                        <tr key={s.label} className="border-b border-line last:border-b-0">
                          <th scope="row" className="w-2/5 px-4 py-3 text-left font-semibold">
                            {s.label}
                          </th>
                          <td className="px-4 py-3 text-muted">{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
            {product.description.length ? (
              <div className="grid gap-3 text-[0.93rem] leading-[1.7] text-muted">
                {product.description.map((line, i) => (
                  <p key={i} className={line.startsWith("•") ? "pl-4 -indent-4" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {related.length ? (
          <section className="mt-16 border-t border-line pt-10">
            <Fig>Same aisle</Fig>
            <h2 className="mt-3 font-display text-[1.6rem] leading-tight tracking-[-0.022em]">
              Usually bought alongside
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
