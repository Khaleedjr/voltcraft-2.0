"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { SITE } from "@/lib/site";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const fieldClass =
  "w-full border border-line bg-raised px-3.5 py-2.5 text-[0.92rem] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink";

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: { ok?: boolean; error?: string } = await res.json();
      if (res.ok && json.ok) {
        setStatus({ kind: "sent" });
        form.reset();
      } else {
        setStatus({ kind: "error", message: json.error ?? "Something went wrong." });
      }
    } catch {
      setStatus({ kind: "error", message: "Network problem — please try again." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="border border-earth bg-sheet p-6">
        <p className="font-display text-2xl tracking-[-0.015em]">Message sent.</p>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
          We reply during counter hours, usually the same working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="vc-fig mb-2 block text-muted">
            Your name
          </label>
          <input id="cf-name" name="name" required maxLength={120} className={fieldClass} placeholder="Ada Okoro" />
        </div>
        <div>
          <label htmlFor="cf-email" className="vc-fig mb-2 block text-muted">
            Email
          </label>
          <input id="cf-email" name="email" type="email" required maxLength={200} className={fieldClass} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label htmlFor="cf-subject" className="vc-fig mb-2 block text-muted">
          Subject
        </label>
        <input id="cf-subject" name="subject" required maxLength={200} className={fieldClass} placeholder="Stock request — STM32 boards" />
      </div>
      <div>
        <label htmlFor="cf-message" className="vc-fig mb-2 block text-muted">
          Message
        </label>
        <textarea id="cf-message" name="message" required rows={6} maxLength={5000} className={`${fieldClass} resize-y`} placeholder="What are you building, and what do you need?" />
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="border-l-2 border-live bg-sheet px-4 py-3 text-[0.88rem] leading-relaxed text-muted">
          {status.message}{" "}
          <a href={`mailto:${SITE.email}`} className="border-b border-live text-ink hover:text-live">
            {SITE.email}
          </a>{" "}
          ·{" "}
          <a href={SITE.phoneHref} className="border-b border-live text-ink hover:text-live">
            {SITE.phone}
          </a>
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
