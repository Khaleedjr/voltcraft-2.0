import type { Metadata } from "next";
import { BG_SCRIPT } from "@/components/home-v/background-picker";
import "@/components/home-v/home-v.css";

/**
 * Five versions of the home page, side by side for choosing. Not for search
 * engines; the folder goes once a version is picked.
 */
export const metadata: Metadata = {
  title: "Home page versions",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BG_SCRIPT }} />
      {children}
    </>
  );
}
