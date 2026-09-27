import { CatalogueProvider } from "@/components/catalogue-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLiteCatalogue } from "@/lib/catalogue-data";

/**
 * The shop's chrome — header, footer, and the lean catalogue the cart prices
 * from. Used by the (store) layout and by the root not-found page, which
 * renders outside every route group and would otherwise lose the header.
 */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  const catalogue = await getLiteCatalogue();
  return (
    <CatalogueProvider products={catalogue}>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </CatalogueProvider>
  );
}
