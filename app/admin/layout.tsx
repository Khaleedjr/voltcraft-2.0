import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — VoltCraft admin" },
  robots: { index: false, follow: false },
};

/** Everything under /admin: kept out of search, and outside the shop's chrome. */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
