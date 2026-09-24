import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/wordmark";
import { getAdminSession, isAdminConfigured, safeNext } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdminSession()) redirect("/admin");
  const params = await searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);
  const configured = isAdminConfigured();

  return (
    <main id="main" className="grid flex-1 place-items-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mx-auto mb-8 block w-[132px]" aria-label="VoltCraft shop">
          <Wordmark className="h-auto w-full" priority />
        </Link>

        <div className="border border-line bg-raised p-6 shadow-[0_18px_50px_rgba(var(--vc-shadow),0.08)] sm:p-8">
          <p className="vc-fig text-live">Admin</p>
          <h1 className="mt-2 font-display text-[1.6rem] leading-tight tracking-[-0.02em]">Sign in to the counter</h1>

          {configured ? (
            <LoginForm next={next} />
          ) : (
            <div className="mt-5 text-[0.88rem] leading-relaxed text-muted">
              <p>No admin accounts are set up on this deployment yet. To add one:</p>
              <ol className="mt-3 grid list-decimal gap-2 pl-5">
                <li>
                  Run <code className="font-mono text-[0.8rem] text-ink">node scripts/admin-password.mjs you@example.com</code>{" "}
                  and set the line it prints as <code className="font-mono text-[0.8rem] text-ink">ADMIN_ACCOUNTS</code>.
                </li>
                <li>
                  Run <code className="font-mono text-[0.8rem] text-ink">node scripts/admin-password.mjs --secret</code> and set{" "}
                  <code className="font-mono text-[0.8rem] text-ink">ADMIN_SESSION_SECRET</code>.
                </li>
                <li>Redeploy, and sign in here.</li>
              </ol>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[0.84rem]">
          <Link href="/" className="text-muted hover:text-live">
            ← Back to the shop
          </Link>
        </p>
      </div>
    </main>
  );
}
