import Link from "next/link";

export type SortKey = "name" | "price-asc" | "price-desc";

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "A–Z" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
];

export function SortLinks({
  active,
  basePath,
  query,
}: {
  active: SortKey;
  basePath: string;
  query?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="vc-fig text-faint">Sort</span>
      <div className="flex gap-1.5">
        {OPTIONS.map((o) => {
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (o.key !== "name") params.set("sort", o.key);
          const href = params.toString() ? `${basePath}?${params}` : basePath;
          return (
            <Link
              key={o.key}
              href={href}
              aria-current={active === o.key ? "true" : undefined}
              className={`border px-2.5 py-1 text-[0.78rem] transition-colors ${
                active === o.key
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function sortProducts<T extends { name: string; price: number }>(
  items: T[],
  key: SortKey,
): T[] {
  const copy = [...items];
  if (key === "price-asc") return copy.sort((a, b) => a.price - b.price);
  if (key === "price-desc") return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseSort(value: string | string[] | undefined): SortKey {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "price-asc" || v === "price-desc" ? v : "name";
}
