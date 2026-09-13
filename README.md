# VoltCraft

A rebuild of [voltcraft.org.ng](https://voltcraft.org.ng) as a Next.js storefront —
engineering tools, dev boards, components and test gear for makers, students and
builders in Nigeria.

**Hack it. Build it. Craft it.**

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4, theme defined in `app/globals.css` |
| Fonts | Instrument Serif, Public Sans, IBM Plex Mono — self-hosted via `next/font` |
| Payments | Paystack (card, bank transfer, USSD) |
| State | Cart in a module store read through `useSyncExternalStore`, persisted to `localStorage` |

No database and no CMS yet — see [What still needs real data](#what-still-needs-real-data).

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — the app runs without any keys
npm run dev                  # http://localhost:3000
```

```bash
npm run build   # production build
npm start       # serve the build
npm run lint    # ESLint, including the React Compiler rules
npx tsc --noEmit  # typecheck
```

## Environment variables

Everything is optional. The app degrades honestly rather than breaking when a
key is missing.

| Variable | Effect when set | Behaviour when unset |
| --- | --- | --- |
| `PAYSTACK_SECRET_KEY` | Checkout initialises a real Paystack transaction and verifies it server-side on return | Checkout records the order and sends the customer to a confirmation page saying the counter will call to arrange payment |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Reserved for a future inline checkout | Unused |
| `CONTACT_WEBHOOK_URL` | Contact form POSTs the message as JSON to this endpoint (mail service, Slack/Discord webhook, CRM) | The form tells the sender to email or call instead of silently dropping the message |

## Structure

```
app/
  page.tsx                    home
  shop/                       catalogue, search, sort
  shop/[category]/            one aisle
  product/[slug]/             product detail, prerendered per product
  cart/  checkout/            cart, delivery details, payment
  checkout/callback/          Paystack return — verified server-side
  checkout/received/          order placed without online payment
  about/  contact/  delivery/ content pages
  api/checkout/               starts a payment; reprices the cart server-side
  api/contact/                contact form delivery
components/                   UI, all presentational pieces
lib/
  catalogue.ts                products, categories and accessors
  orders.ts                   the single pricing function
  cart-store.ts               cart state outside React
  paystack.ts                 initialise + verify
  site.ts                     name, contact details, thresholds
public/brand/                 logo, wordmark and icon, extracted from the supplied artwork
```

### Two rules worth keeping

1. **Prices are computed server-side.** The browser sends slugs and quantities;
   `lib/orders.ts` looks up every price from the catalogue. A tampered cart
   cannot change what gets charged.
2. **Everything reads the catalogue through accessors.** Swapping
   `lib/catalogue.ts` for a CMS or database means changing that one file.

## Design

The "Blueprint" direction: a drawing-sheet grid, prussian ink, and the red of a
live conductor used sparingly — one button, the figure marks, nothing else.
Instrument Serif carries the headlines, IBM Plex Mono carries anything
technical: SKUs, specifications, table headers.

The logo is deliberately the one raw element on an otherwise precise page. It
ships as transparent PNGs in `public/brand/`, keyed out of the supplied artwork
and inverted for the dark theme via a CSS filter.

Light and dark are both first-class. Tokens are declared on `:root`, redefined
under `prefers-color-scheme: dark`, and redefined again under
`[data-theme="dark"]` so the header toggle wins in either direction. A tiny
inline script in the root layout applies the stored choice before first paint.

Products have no photography yet, so listings render a drawing-sheet plate —
registration ticks, the SKU, and a schematic glyph for the aisle. Replace
`components/product-plate.tsx` with `next/image` once photos exist.

## What still needs real data

Everything below is a placeholder written to be plausible, **not** VoltCraft's
real information. Replace before launch.

- **`lib/catalogue.ts`** — all 44 products, their specifications, stock counts
  and naira prices are invented. Swap in the real stock list.
- **`lib/site.ts`** — phone number, email, WhatsApp link, opening hours, social
  links and the free-delivery threshold are placeholders.
- **`app/delivery/page.tsx`** — delivery zones and timings, the 7-day returns
  window and the 30-day fault window are drafted to a sensible default. These
  are commercial commitments; confirm every one.
- **`app/about/page.tsx`** — contains no founding date, founder name or history,
  because none was supplied. Add the real story.
- **Product photography** — see above.
- **Order persistence** — `app/api/checkout/route.ts` logs the priced order and
  does not store it. Write it to a database there, and add a Paystack webhook
  handler, before taking real money.

## Related

Bulk quotes are handled by the existing quote app at
[quote.voltcraft.org.ng](https://quote.voltcraft.org.ng), which this site links
out to from the header, product pages, cart and footer.
