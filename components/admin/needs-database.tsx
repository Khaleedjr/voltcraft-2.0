import { Icon } from "@/components/admin/icons";
import { EmptyState, PageHeader } from "@/components/admin/ui";

/** What an admin page shows when there is no database to manage yet. */
export function NeedsDatabase({ title }: { title: string }) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} />
      <div className="border border-line bg-raised">
        <EmptyState icon={<Icon.Stock />} title="Connect the database to manage the shop">
          <p>
            Products, stock and orders live in Supabase. Until it is connected, the shop runs on the bundled
            catalogue and cannot be edited here.
          </p>
          <ol className="mx-auto mt-4 grid max-w-[46ch] list-decimal gap-1.5 pl-5 text-left">
            <li>
              Run <code className="font-mono text-[0.8rem] text-ink">supabase/schema.sql</code> in the Supabase SQL editor.
            </li>
            <li>
              Set <code className="font-mono text-[0.8rem] text-ink">SUPABASE_URL</code> and{" "}
              <code className="font-mono text-[0.8rem] text-ink">SUPABASE_SERVICE_ROLE_KEY</code>, and redeploy.
            </li>
            <li>Come back here and import the catalogue.</li>
          </ol>
        </EmptyState>
      </div>
    </div>
  );
}
