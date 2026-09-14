import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryRail } from "@/components/category-rail";
import { ProductCard } from "@/components/product-card";
import { SortLinks, parseSort, sortProducts } from "@/components/sort-links";
import { Container, Fig } from "@/components/ui";
import { getCategories, getCategory, getProductsByCategory } from "@/lib/catalogue";

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  const found = getCategory(category);
  if (!found) return { title: "Category not found" };
  return { title: found.name, description: found.blurb };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/shop/[category]">) {
  const { category } = await params;
  const found = getCategory(category);
  if (!found) notFound();

  const sort = parseSort((await searchParams).sort);
  const products = sortProducts(getProductsByCategory(found.slug), sort);

  return (
    <Container>
      <div className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="vc-fig mb-6 text-faint">
          <Link href="/shop" className="hover:text-live">
            Catalogue
          </Link>
          <span className="px-2">/</span>
          <span className="text-muted">{found.name}</span>
        </nav>

        <Fig>{found.note}</Fig>
        <h1 className="mt-3 max-w-[20ch] font-display text-[2rem] leading-[1.08] tracking-[-0.025em] sm:text-[2.6rem]">
          {found.name}
        </h1>
        <p className="mt-4 max-w-[54ch] text-[0.98rem] leading-relaxed text-muted">{found.blurb}</p>

        <div className="mt-8">
          <CategoryRail active={found.slug} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
          <span className="vc-fig text-faint">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
          <SortLinks active={sort} basePath={`/shop/${found.slug}`} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </Container>
  );
}
