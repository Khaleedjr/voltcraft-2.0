# VoltCraft

A rebuild of [voltcraft.org.ng](https://voltcraft.org.ng) as a Next.js storefront —
engineering tools, dev boards, components and test gear for makers, students and
builders in Nigeria — with the shop's own admin built in.

**Hack it. Build it. Craft it.**

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4, theme defined in `app/globals.css` |
| Fonts | Archivo, IBM Plex Sans, IBM Plex Mono — self-hosted via `next/font` |
| Database | Supabase: Postgres for products, stock, orders and customers; Storage for product photos |
| Payments | Paystack (card, bank transfer, USSD), confirmed by a signed webhook |
| Admin | Built in at `/admin` — no WordPress, no plugins |
| State | Cart in a module store read through `useSyncExternalStore`, persisted to `localStorage` |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — the shop runs without any keys
npm run dev                  # http://localhost:3000
```

```bash
npm run build   # production build
npm start       # serve the build
npm run lint    # ESLint, including the React Compiler rules
npx tsc --noEmit  # typecheck
```

### Turning on the database and the admin

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
   The file is idempotent: run it again after pulling an update.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Make an account for each person who runs the shop:
   `node scripts/admin-password.mjs you@example.com` asks for a password and
   prints a line for `ADMIN_ACCOUNTS` (join several with commas).
   `node scripts/admin-password.mjs --secret` prints an `ADMIN_SESSION_SECRET`.
4. Deploy, sign in at `/admin`, and import the bundled catalogue from the
   Products page. From then on the shop reads products, prices and stock from
   the database.

## Environment variables

Everything is optional. The app degrades honestly rather than breaking when a
key is missing.

| Variable | Effect when set | Behaviour when unset |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Products, stock and orders are read from and written to the database; the admin works | The shop serves the bundled catalogue; the admin explains what to set up; checkout will not take payments |
| `ADMIN_ACCOUNTS` | These people can sign in at `/admin` | Nobody can; the sign-in page says the admin is not set up |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie (32+ characters) | Same as above |
| `PAYSTACK_SECRET_KEY` | Checkout initialises a real Paystack transaction; the webhook and the return page both verify it server-side | Checkout records the order and tells the customer the counter will call to arrange payment |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Reserved for a future inline checkout | Unused |
| `CONTACT_WEBHOOK_URL` | Contact form POSTs the message as JSON to this endpoint (mail service, Slack/Discord webhook, CRM) | The form tells the sender to email or call instead of silently dropping the message |

The service-role key bypasses row-level security, so it is server-only: it has
no `NEXT_PUBLIC_` prefix and `lib/supabase.ts` imports `server-only`. Every
table has RLS on with no policies and the anon role's grants revoked, so the
anon key can read nothing.

## The admin

Everything a WooCommerce back office does for this shop, at `/admin`:

- **Overview** — what is waiting on a person (orders to pack, payments to
  check, unpaid orders this week, stock to reorder), today's and the month's
  sales, the latest orders and what is running low.
- **Orders** — search by reference, name, email or any spelling of the phone
  number; filter by state and date; record a transfer, cash or POS payment;
  accept or refuse a wrong-amount payment; pack, ship with tracking, deliver;
  cancel and refund (stock goes back on the shelf); internal notes; a packing
  slip; a timeline of everything that happened; CSV export.
- **Products** — list, search, filter by aisle and stock; add and edit with
  photos (resized in the browser, stored in Supabase Storage), price and
  was-price, specs, tags and aisles; drafts, duplicates, a trash; bulk actions.
  Changes reach the shop straight away.
- **Stock** — a ledger of every movement with who made it and why; restocks,
  write-offs, stocktakes and multi-line deliveries; low-stock alerts per
  product.
- **Customers** — everyone who has ordered, by email address: spend, orders,
  average order, repeat buyers; a profile with every order, what they buy,
  every phone number and address they have used; CSV export.
- **Analytics** — revenue and orders over time against the period before;
  where orders stand (placed → paid → shipped → delivered); best sellers with
  days of stock left at the current pace; aisles, states and payment methods;
  new against returning customers; the weekday and hour orders come in; daily
  figures as CSV for reconciling against the bank.

How the numbers are counted:

- Every date is on the **Lagos calendar**, whatever zone the server runs in.
- An order is dated by **when it was placed**.
- **Revenue is money kept**: paid orders that were not cancelled or refunded.
  An amount mismatch counts once someone accepts the payment.

Security, in short: passwords are scrypt hashes in an environment variable; the
session is an HMAC-signed, `httpOnly`, `SameSite=Strict` cookie scoped to
`/admin` and tied to the password hash, so a password change signs that person
out everywhere; sign-in is rate-limited; `proxy.ts` sends signed-out visitors to
the sign-in page and marks every admin response `noindex` and `no-store`, and
every page, action and export checks the session itself as well.

## Structure

```
app/
  (store)/                    the shop: home, shop, aisles, product pages,
                              cart, checkout, about, contact, delivery
  admin/login/                sign-in
  admin/(panel)/              overview, orders, products, stock, customers, analytics
  api/checkout/               starts a payment; reprices the cart server-side
  api/paystack/webhook/       confirms payments; verified against the raw body
  api/contact/                contact form delivery
components/                   the shop's UI
components/admin/             the admin's UI: forms, tables, badges, charts
lib/
  catalogue.ts                product and category types and pure helpers
  catalogue-data.ts           where the shop reads products from (database or bundled), cached
  orders.ts                   the single pricing function
  order-store.ts              writing orders and settling payments
  supabase.ts                 the one server-side database client
  admin/                      the admin's queries, actions' helpers, auth and report arithmetic
supabase/schema.sql           tables, stock and order functions, row-level security
proxy.ts                      the admin's front door
scripts/                      catalogue import, image download, admin passwords
```

### Rules worth keeping

1. **Prices are computed server-side.** The browser sends slugs and quantities;
   `lib/orders.ts` prices every line from the catalogue. A tampered cart
   cannot change what gets charged.
2. **Stock only moves through the database functions** in `supabase/schema.sql`
   (`adjust_stock`, `receive_stock`, `apply_order_stock`, …). Each one locks
   the row, writes the ledger entry in the same transaction and refuses to go
   below zero, so the ledger always explains the number on the shelf.
3. **Every server action is a public endpoint.** Each one calls
   `requireAdmin()` and validates its form data itself; the layout and the
   proxy are conveniences, not the gate.

## Design

A drawing-sheet grid, warm paper in light and blackened steel in dark, and the
gold off the logo as the one accent. Archivo carries headlines, IBM Plex Sans
the text, and IBM Plex Mono anything technical: SKUs, specifications, figures.

Light is the default and dark is a choice. Tokens live on `:root` and are
redefined under `[data-theme="dark"]`; an inline script in the root layout
applies the stored choice (or the OS setting) before first paint.

The admin's charts are drawn from scratch in SVG. Their colours are tokens in
`app/globals.css`, each checked for contrast and lightness rather than picked
by eye, all on the gold's hue. Every chart answers the keyboard as well as the
pointer and has its numbers as a table underneath.

## The catalogue

`data/catalogue.json` is **generated** — do not hand-edit it. It comes from a
WooCommerce export of the live store:

```bash
# WP Admin → Products → Export → CSV, then:
node scripts/import-woocommerce.mjs ~/Downloads/wc-product-export.csv
```

The importer handles variable products (variations become `variants`), sale
pricing, categories, attributes and HTML descriptions, and prints anything it
had to skip so nothing disappears silently.

It is the shop's starting point and its fallback: until the catalogue is
imported into the database (Admin → Products), the shop serves this file.

## Product photography

Imported products keep the store's own images, served from the existing
WordPress media library at `voltcraft.org.ng/wp-content/uploads/`, which
`next.config.ts` allows under `images.remotePatterns`. Photos added in the
admin go to the `product-images` bucket in Supabase Storage.

To stop depending on the old site — before switching WordPress off — pull the
old images local with `node scripts/download-images.mjs`, or re-upload them
through the admin.

## What still needs real data

- **`lib/site.ts`** — phone number, email, WhatsApp link, opening hours, social
  links, and the ₦25,000 free-delivery threshold.
- **`app/(store)/delivery/page.tsx`** — delivery zones and timings, the 7-day
  returns window and the 30-day fault window. These are commercial
  commitments; confirm every one.
- **`app/(store)/about/page.tsx`** — contains no founding date, founder name or
  history, because none was supplied.

## Related

Bulk quotes are handled by the existing quote app at
[quote.voltcraft.org.ng](https://quote.voltcraft.org.ng), which this site links
out to from the header, product pages, cart and footer.
