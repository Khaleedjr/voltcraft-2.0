/** Single source of truth for the things that show up in a dozen places. */
export const SITE = {
  name: "VoltCraft",
  tagline: "Hack it. Build it. Craft it.",
  description:
    "Engineering tools, dev boards, components and test gear for makers, students and builders in Nigeria. Stocked in Kaduna, delivered nationwide.",
  url: "https://voltcraft.org.ng",
  quoteUrl: "https://quote.voltcraft.org.ng",
  email: "sales@voltcraft.org.ng",
  phone: "+234 800 000 0000",
  phoneHref: "tel:+2348000000000",
  whatsapp: "https://wa.me/2348000000000",
  city: "Kaduna, Nigeria",
  hours: [
    { days: "Mon–Fri", time: "08:00 – 17:00" },
    { days: "Saturday", time: "09:00 – 14:00" },
    { days: "Sunday", time: "Closed" },
  ],
  freeDeliveryThreshold: 150_000,
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "X", href: "https://x.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
  ],
} as const;
