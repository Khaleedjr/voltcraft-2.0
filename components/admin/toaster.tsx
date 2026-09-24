"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/admin/icons";

/**
 * Confirmations that outlive the form that raised them.
 *
 * A successful action often removes its own form — record a payment and the
 * payment form goes, since the order is paid; trash the last product on a
 * page and the list goes. A message kept in that form's state would vanish
 * with it. So successes are announced here instead, from the admin layout,
 * which stays put. Errors stay inline, next to what needs fixing.
 */

const EVENT = "vc-admin-toast";
type Toast = { id: number; message: string };

export function toast(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

let seq = 0;

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const id = ++seq;
      setToasts((list) => [...list.slice(-2), { id, message: (e as CustomEvent<string>).detail }]);
      window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 5000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6 print:hidden">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="vc-toast pointer-events-auto flex max-w-[26rem] items-start gap-3 border border-line border-l-4 border-l-earth bg-raised px-4 py-3 text-[0.88rem] shadow-[0_14px_40px_rgba(var(--vc-shadow),0.18)]"
        >
          <Icon.Check className="mt-0.5 size-4 shrink-0 text-earth" />
          <span className="flex-1 leading-snug">{t.message}</span>
          <button type="button" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))} className="text-faint hover:text-ink" aria-label="Dismiss">
            <Icon.Close className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
