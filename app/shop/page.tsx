import type { Metadata } from "next";
import Link from "next/link";
import { CategoryRail } from "@/components/category-rail";
import { ProductCard } from "@/components/product-card";
import { SortLinks, parseSort, sortProducts } from "@/components/sort-links";
import { Container, Fig } from "@/components/ui";
import { getProducts, searchProducts } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Dev boards, components, sensors, test gear, soldering kit and bench tools — held in Kaduna, delivered across Nigeria.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";
  const sort = parseSort(params.sort);

  const results = query ? searchProducts(query) : getProducts();
  const products = sortProducts(results, sort);

  return (
    <Container>
      <div className="py-10 sm:py-14">
        <Fig>{query ? "Search results" : "Catalogue"}</Fig>
        <h1 className="mt-3 max-w-[20ch] font-display text-[2rem] leading-[1.08] tracking-[-0.025em] sm:text-[2.6rem]">
          {query ? (
            <>
              Results for <em className="text-live">{query}</em>
            </>
          ) : (
            "Everything on the shelf"
          )}
        </h1>
        <p className="mt-4 max-w-[54ch] text-[0.98rem] leading-relaxed text-muted">
          {query
            ? `${products.length} ${products.length === 1 ? "product matches" : "products match"} your search. Every price is in naira and every count is real stock in Kaduna.`
            : "Priced in naira, counted in Kaduna, dispatched the same working day when you order before 2pm."}
        </p>

        <div className="mt-8">
          <CategoryRail />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
          <span className="vc-fig text-faint">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
          <SortLinks active={sort} basePath="/shop" query={query || undefined} />
        </div>

        {products.length === 0 ? (
          <div className="mt-12 border border-line bg-sheet p-10 text-center">
            <p className="font-display text-[1.3rem] tracking-[-0.018em]">Nothing matched that.</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">
              Try a broader term — a part number, a family like <em>esp32</em>, or what the thing
              does, like <em>distance</em>. If we should be stocking it, tell us and we&apos;ll look
              at the next order.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/shop" className="border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                Browse everything →
              </Link>
              <Link href="/contact" className="border-b border-ink pb-1 text-[0.9rem] font-semibold hover:border-live hover:text-live">
                Ask us to stock it →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
