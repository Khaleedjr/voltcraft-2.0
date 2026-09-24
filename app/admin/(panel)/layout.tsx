import { AdminSidebar, AdminTopbar, type NavCounts } from "@/components/admin/shell";
import { Toaster } from "@/components/admin/toaster";
import { getAdminSession } from "@/lib/admin/auth";
import { getNavCounts } from "@/lib/admin/counts";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * The admin's frame. It shows who is signed in and what needs doing, but it
 * is not the gate: a layout does not re-render on navigation, so every page
 * below calls requireAdmin() itself. The counts are only read for a valid
 * session, so a signed-out request never touches the database from here.
 */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await getAdminSession();
  let counts: NavCounts | null = null;
  if (session && isSupabaseConfigured()) {
    counts = await getNavCounts().catch((error) => {
      console.error("[admin] nav counts failed", error);
      return null;
    });
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-ground lg:grid lg:grid-cols-[248px_minmax(0,1fr)] print:block print:bg-white">
      <AdminSidebar session={session} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar session={session} counts={counts} />
        <main id="main" className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
