/** Single source of truth for the things that show up in a dozen places. */
export const SITE = {
  name: "VoltCraft",
  tagline: "Hack it. Build it. Craft it.",
  description:
    "Sensors, microcontrollers, displays, actuators and the components that go with them — for makers, students and builders in Nigeria. Stocked in Kaduna, delivered nationwide.",
  url: "https://voltcraft.org.ng",
  /** Separate service, separate site: custom 3D printing, quoted per job. */
  printingUrl: "https://quote.voltcraft.org.ng",
  email: "voltcraftrobotics@gmail.com",
  phone: "0903 622 5266",
  phoneHref: "tel:+2349036225266",
  /** Same number as the phone line. */
  whatsapp: "https://wa.me/2349036225266",
  city: "Kaduna, Nigeria",
  hours: [
    { days: "Mon – Sat", time: "09:00 – 18:00" },
    { days: "Sunday", time: "Closed" },
  ],
  freeDeliveryThreshold: 25_000,
  socials: [
    { label: "Instagram", handle: "voltcraftrobotics", href: "https://instagram.com/voltcraftrobotics", icon: "instagram" },
    { label: "WhatsApp", handle: "0903 622 5266", href: "https://wa.me/2349036225266", icon: "whatsapp" },
  ],
} as const;
