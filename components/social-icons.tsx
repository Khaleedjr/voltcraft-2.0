/**
 * Simple outline glyphs for the social links, so the footer shows marks rather
 * than the words "Instagram" and "WhatsApp".
 */

export function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.45L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z" strokeLinejoin="round" />
      <path d="M9 8.4c.3-.1.6 0 .8.3l.8 1.3c.1.2.1.5 0 .7l-.5.7c-.1.2-.1.4 0 .6a6 6 0 0 0 2.1 2.1c.2.1.4.1.6 0l.7-.5c.2-.1.5-.1.7 0l1.3.8c.3.2.4.5.3.8-.2.7-.9 1.3-1.7 1.3-3 0-6.1-3.1-6.1-6.1 0-.8.5-1.6 1.2-1.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  whatsapp: WhatsAppIcon,
} as const;
