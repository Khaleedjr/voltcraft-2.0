import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
};

/** Everything a shopper sees. The admin lives outside this group, with its own shell. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreShell>{children}</StoreShell>;
}
