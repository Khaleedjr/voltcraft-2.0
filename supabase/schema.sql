-- VoltCraft — orders
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is guarded.
--
-- Money is stored as whole naira in `integer`, matching the catalogue and
-- lib/orders.ts. Paystack works in kobo; the conversion happens at the edge of
-- the app so nothing inside it has to remember which unit it is holding.

create table if not exists public.orders (
  -- our reference (VC-XXXX-XXXX), also the Paystack transaction reference, so
  -- a customer reading it down the phone identifies the order and the payment
  reference       text primary key,

  -- pending   : order priced and written, customer sent to Paystack
  -- paid       : Paystack confirmed, amount matched the priced total
  -- failed     : Paystack reported the charge did not complete
  -- mismatch   : paid, but not for the amount we priced — needs a human
  status          text not null default 'pending'
                    check (status in ('pending', 'paid', 'failed', 'mismatch')),

  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  address         text not null,
  city            text not null,
  state           text not null,
  notes           text,

  -- the priced lines as sent to Paystack: sku, slug, name, qty, unit price,
  -- line total. Snapshotted rather than joined, so a later price change never
  -- rewrites history on an order already placed.
  items           jsonb not null,
  subtotal        integer not null,
  delivery        integer not null,
  total           integer not null,

  paid_amount     integer,
  paid_channel    text,
  paid_at         timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- Orders are written only by the server, using the service-role key, which
-- bypasses row-level security. Enabling RLS and defining NO policies therefore
-- means the anon/publishable key can read and write nothing here — which is
-- exactly right for a table holding customers' names, phones and addresses.
alter table public.orders enable row level security;
