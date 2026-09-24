import Link from "next/link";
import { getCategories } from "@/lib/catalogue";
import { getCategoryCounts, getProducts } from "@/lib/catalogue-data";

export async function CategoryRail({ active }: { active?: string }) {
  const categories = getCategories();
  const [products, counts] = await Promise.all([getProducts(), getCategoryCounts()]);
  const isAll = !active;
  return (
    <nav aria-label="Product categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max min-w-full gap-2 pb-1 sm:w-auto sm:flex-wrap">
        <li>
          <Link
            href="/shop"
            aria-current={isAll ? "page" : undefined}
            className={`inline-flex items-baseline gap-2 whitespace-nowrap border px-3.5 py-2 text-[0.85rem] transition-colors ${
              isAll
                ? "border-ink bg-ink text-ground"
                : "border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            All
            <span className="font-mono text-[0.7rem] opacity-70 tabular-nums">
              {products.length}
            </span>
          </Link>
        </li>
        {categories.map((c) => {
          const on = active === c.slug;
          return (
            <li key={c.slug}>
              <Link
                href={`/shop/${c.slug}`}
                aria-current={on ? "page" : undefined}
                className={`inline-flex items-baseline gap-2 whitespace-nowrap border px-3.5 py-2 text-[0.85rem] transition-colors ${
                  on
                    ? "border-ink bg-ink text-ground"
                    : "border-line text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {c.name}
                <span className="font-mono text-[0.7rem] opacity-70 tabular-nums">
                  {counts[c.slug]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
