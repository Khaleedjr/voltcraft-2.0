"use client";

import { createContext, useContext, useMemo } from "react";
import type { LiteProduct } from "@/lib/catalogue";

/**
 * The shop's products, as far as the browser needs them.
 *
 * The store layout reads the catalogue on the server and hands the lean copy
 * down here, so the cart can draw and price its lines without the whole
 * catalogue being bundled into the JavaScript — and without going stale when
 * a price changes in the admin, because the layout is re-rendered when it does.
 */

export type CatalogueLookup = (slug: string) => LiteProduct | undefined;

const CatalogueContext = createContext<ReadonlyMap<string, LiteProduct>>(new Map());

export function CatalogueProvider({
  products,
  children,
}: {
  products: LiteProduct[];
  children: React.ReactNode;
}) {
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  return <CatalogueContext value={bySlug}>{children}</CatalogueContext>;
}

/** Look a product up by slug. Undefined for anything no longer on sale. */
export function useCatalogue(): CatalogueLookup {
  const bySlug = useContext(CatalogueContext);
  return useMemo(() => (slug: string) => bySlug.get(slug), [bySlug]);
}
