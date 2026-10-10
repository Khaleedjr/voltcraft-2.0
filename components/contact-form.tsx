"use client";

import { useState } from "react";
import { WhatsAppIcon } from "@/components/social-icons";
import { Button } from "@/components/ui";
import { SITE } from "@/lib/site";

const fieldClass =
  "w-full border border-line bg-raised px-3.5 py-2.5 text-[0.92rem] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink";

/** The message as it lands in the counter's WhatsApp. */
function compose(name: string, subject: string, message: string): string {
  const lines = [`Hello VoltCraft, I'm ${name}.`];
  if (subject) lines.push(`Subject: ${subject}`);
  lines.push("", message);
  return lines.join("\n");
}

/**
 * The contact form hands the message to WhatsApp rather than to a mail
 * service: submitting opens a chat with the counter's number with the message
 * already typed, and the sender only has to press send. Nothing goes through
 * this site's server, so there is nothing to configure and nothing to lose.
 *
 * The chat opens in a new tab where the browser allows it (the shop stays
 * open behind it); on a phone, wa.me hands over to the WhatsApp app. A link
 * to the same chat stays under the form in case nothing opened.
 */
export function ContactForm() {
  const [opened, setOpened] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (k: string) => String(data.get(k) ?? "").trim();
    const url = `${SITE.whatsapp}?text=${encodeURIComponent(compose(field("name"), field("subject"), field("message")))}`;
    const tab = window.open(url, "_blank");
    if (tab) tab.opener = null;
    // wa.me is an external site, not a route of this app
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    else window.location.href = url;
    setOpened(url);
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
          <label htmlFor="cf-subject" className="vc-fig mb-2 block text-muted">
            Subject <span className="normal-case tracking-normal text-faint">(optional)</span>
          </label>
          <input id="cf-subject" name="subject" maxLength={200} className={fieldClass} placeholder="Stock request — STM32 boards" />
        </div>
      </div>
      <div>
        <label htmlFor="cf-message" className="vc-fig mb-2 block text-muted">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          className={`${fieldClass} resize-y`}
          placeholder="What are you building, and what do you need?"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit">
          <WhatsAppIcon className="size-4" /> Send on WhatsApp
        </Button>
        <p className="text-[0.82rem] text-muted">Opens WhatsApp with your message ready to send to {SITE.phone}.</p>
      </div>

      {opened ? (
        <p role="status" className="border-l-2 border-earth bg-sheet px-4 py-3 text-[0.88rem] leading-relaxed text-muted">
          WhatsApp should now be open with your message. Just press send.{" "}
          <a href={opened} target="_blank" rel="noreferrer" className="border-b border-live font-semibold text-ink hover:text-live">
            Didn&apos;t open? Tap here
          </a>
        </p>
      ) : null}
    </form>
  );
}
