import { StoreShell } from "@/components/store-shell";

/** Everything a shopper sees. The admin lives outside this group, with its own shell. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreShell>{children}</StoreShell>;
}
