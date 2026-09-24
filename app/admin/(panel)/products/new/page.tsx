import type { Metadata } from "next";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { ProductEditor } from "@/components/admin/product-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="New product" />;
  return (
    <div className="grid gap-6">
      <PageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      <ProductEditor product={null} canUpload />
    </div>
  );
}
