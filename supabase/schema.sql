-- VoltCraft — database schema
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run at any time: every statement is guarded, and nothing here
-- drops or rewrites data. Re-running it after an update is how you migrate.
--
-- Money is stored as whole naira in `integer`, matching the catalogue and
-- lib/orders.ts. Paystack works in kobo; the conversion happens at the edge of
-- the app so nothing inside it has to remember which unit it is holding.
--
-- Security model, in one paragraph: the app talks to this database only from
-- the server, with the service-role key, which bypasses row-level security.
-- Every table here has RLS enabled and NO policies, and the anon and
-- authenticated roles have their table and function privileges revoked, so
-- the public anon key can read nothing, write nothing and call nothing. Stock
-- is only ever changed through the functions below, which lock the product row
-- and write the ledger entry in the same transaction.


-- =============================================================================
-- Orders
-- =============================================================================

create table if not exists public.orders (
  -- our reference (VC-XXXX-XXXX), also the Paystack transaction reference, so
  -- a customer reading it down the phone identifies the order and the payment
  reference       text primary key,

  -- payment state. Owned by the payment flow, not by staff:
  -- pending  : order priced and written, customer sent to Paystack (or, with
  --            payments off, waiting for the counter to arrange payment)
  -- paid     : payment confirmed and the amount matched the priced total
  -- failed   : Paystack reported the charge did not complete
  -- mismatch : paid, but not for the amount we priced — needs a human
  -- refunded : money returned to the customer (recorded by staff)
  status          text not null default 'pending',

  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  address         text not null,
  city            text not null,
  state           text not null,
  notes           text,

  -- the priced lines as sent to Paystack: productId, sku, slug, name, image,
  -- qty, unit price, line total. Snapshotted rather than joined, so a later
  -- price change or a deleted product never rewrites an order already placed.
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

-- Added for the admin. `add column if not exists` leaves existing rows alone.
alter table public.orders add column if not exists fulfilment        text not null default 'unfulfilled';
alter table public.orders add column if not exists tracking          text;
alter table public.orders add column if not exists internal_note     text;
alter table public.orders add column if not exists stock_applied_at  timestamptz;
alter table public.orders add column if not exists stock_restored_at timestamptz;

-- Re-declared by name so re-running this file widens the check in place.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'mismatch', 'refunded'));

-- fulfilment is staff-owned, and independent of payment:
-- unfulfilled → packed → shipped → delivered, or cancelled
alter table public.orders drop constraint if exists orders_fulfilment_check;
alter table public.orders add constraint orders_fulfilment_check
  check (fulfilment in ('unfulfilled', 'packed', 'shipped', 'delivered', 'cancelled'));

-- The phone number as digits only, so "0803 123 4567", "08031234567" and
-- "+234 803 123 4567" all turn up when staff search for the number.
alter table public.orders add column if not exists phone_digits text
  generated always as (regexp_replace(customer_phone, '\D', '', 'g')) stored;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);
create index if not exists orders_fulfilment_idx on public.orders (fulfilment);
create index if not exists orders_email_idx      on public.orders (lower(customer_email));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
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


-- =============================================================================
-- Order timeline
-- =============================================================================

create table if not exists public.order_events (
  id              bigint generated always as identity primary key,
  order_reference text not null references public.orders (reference) on delete cascade,
  -- placed | paid | payment_failed | mismatch | payment_recorded | refunded |
  -- fulfilment | cancelled | note | stock_applied | stock_restored
  kind            text not null,
  message         text not null,
  -- 'customer', 'paystack', 'system', or the email of the staff member
  actor           text not null default 'system',
  created_at      timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_reference, created_at);

-- Every order gets its first timeline entry the moment it exists, whichever
-- code path wrote it.
create or replace function public.log_order_placed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.order_events (order_reference, kind, message, actor)
  values (
    new.reference,
    'placed',
    format('Order placed: %s line(s), ₦%s', jsonb_array_length(new.items), to_char(new.total, 'FM999,999,999,999')),
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists orders_log_placed on public.orders;
create trigger orders_log_placed
  after insert on public.orders
  for each row execute function public.log_order_placed();


-- =============================================================================
-- Products
-- =============================================================================

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  -- the URL: /product/<slug>
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (length(btrim(name)) between 1 and 200),
  sku          text not null default '',
  woo_id       text,
  -- active: listed in the shop · draft: hidden, being prepared ·
  -- archived: removed from the shop (the "trash"), kept for order history
  status       text not null default 'active' check (status in ('active', 'draft', 'archived')),
  -- aisle slugs; validated against lib/catalogue.ts CATEGORIES by the app
  categories   text[] not null default '{}',
  summary      text not null default '',
  description  text[] not null default '{}',
  price        integer not null check (price >= 0),
  compare_at   integer check (compare_at is null or compare_at >= 0),
  -- null means the shop does not count this line; in_stock is then the only
  -- signal. A number means it is counted, and may go negative if a sale
  -- outruns the count — that is a discrepancy to investigate, not an error.
  stock        integer,
  in_stock     boolean not null default true,
  low_stock_at integer not null default 5 check (low_stock_at >= 0),
  specs        jsonb not null default '[]',
  tags         text[] not null default '{}',
  images       text[] not null default '{}',
  variants     jsonb,
  featured     boolean not null default false,
  -- catalogue order; new products go to the end
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- The stock rule, in one place, kept current by Postgres itself: out (switched
-- off, or counted to zero or below), low (at or under the product's own
-- threshold), in, or untracked. The shop's "only 3 left" and the admin's
-- low-stock alerts both read the same rule — see stockLabel in lib/catalogue.ts.
alter table public.products add column if not exists stock_state text
  generated always as (
    case
      when not in_stock then 'out'
      when stock is null then 'untracked'
      when stock <= 0 then 'out'
      when stock <= low_stock_at then 'low'
      else 'in'
    end
  ) stored;

-- Every product sits in at least one aisle; the shop files it by the first.
alter table public.products drop constraint if exists products_categories_check;
alter table public.products add constraint products_categories_check check (cardinality(categories) > 0);

create index if not exists products_status_idx     on public.products (status);
create index if not exists products_stock_state_idx on public.products (stock_state);
create index if not exists products_position_idx   on public.products (position, name);
create index if not exists products_categories_idx on public.products using gin (categories);

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- Stock ledger
-- =============================================================================
--
-- Append-only. Every change to a counted stock level writes one row here, in
-- the same transaction as the change, so the ledger and the level can never
-- disagree. The product's name and slug are copied in so the history still
-- reads correctly after a product is renamed or deleted.

create table if not exists public.stock_movements (
  id              bigint generated always as identity primary key,
  product_id      uuid references public.products (id) on delete set null,
  product_slug    text not null,
  product_name    text not null,
  delta           integer not null,
  stock_after     integer,
  -- initial      : counting began (import, or tracking switched on)
  -- restock      : a delivery came in
  -- sale         : an order was paid
  -- cancellation : a paid order was cancelled and its stock put back
  -- return       : a customer brought something back
  -- damage       : broken, lost or written off
  -- adjustment   : a manual correction with a note
  -- stocktake    : counted on the shelf and set to that number
  reason          text not null check (reason in
                    ('initial', 'restock', 'sale', 'cancellation', 'return', 'damage', 'adjustment', 'stocktake')),
  note            text,
  order_reference text,
  -- lines received together in one delivery share a batch
  batch_id        uuid,
  actor           text not null default 'system',
  created_at      timestamptz not null default now()
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);
create index if not exists stock_movements_order_idx   on public.stock_movements (order_reference);


-- -----------------------------------------------------------------------------
-- adjust_stock: add or remove a quantity, with a reason, atomically.
-- Returns the new level. Refuses to take a count below zero by hand.
-- -----------------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_delta      integer,
  p_reason     text,
  p_note       text default null,
  p_actor      text default 'system',
  p_batch_id   uuid default null
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  prod  public.products;
  level integer;
begin
  if p_reason not in ('restock', 'return', 'damage', 'adjustment') then
    raise exception 'adjust_stock: reason must be restock, return, damage or adjustment (got %)', p_reason
      using errcode = '22023';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'adjust_stock: nothing to adjust' using errcode = '22023';
  end if;

  select * into prod from public.products where id = p_product_id for update;
  if not found then
    raise exception 'adjust_stock: no product %', p_product_id using errcode = 'P0002';
  end if;
  if prod.stock is null then
    raise exception 'adjust_stock: % is not stock-counted; set a count first', prod.name using errcode = '22023';
  end if;
  if prod.stock + p_delta < 0 then
    raise exception 'adjust_stock: only % of % on hand, cannot remove %', prod.stock, prod.name, -p_delta
      using errcode = '23514';
  end if;

  update public.products set stock = stock + p_delta where id = p_product_id returning stock into level;

  insert into public.stock_movements
    (product_id, product_slug, product_name, delta, stock_after, reason, note, actor, batch_id)
  values
    (prod.id, prod.slug, prod.name, p_delta, level, p_reason, nullif(btrim(p_note), ''), p_actor, p_batch_id);

  return level;
end;
$$;


-- -----------------------------------------------------------------------------
-- set_stock: a stocktake. Sets the count to what is on the shelf and records
-- the difference. On an uncounted product this is how counting begins.
-- Pass null to stop counting (the ledger keeps its history).
-- -----------------------------------------------------------------------------
create or replace function public.set_stock(
  p_product_id uuid,
  p_level      integer,
  p_note       text default null,
  p_actor      text default 'system'
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  prod public.products;
begin
  if p_level is not null and p_level < 0 then
    raise exception 'set_stock: a count cannot be negative' using errcode = '22023';
  end if;

  select * into prod from public.products where id = p_product_id for update;
  if not found then
    raise exception 'set_stock: no product %', p_product_id using errcode = 'P0002';
  end if;

  if p_level is null then
    update public.products set stock = null where id = p_product_id;
    return null;
  end if;

  if prod.stock is not distinct from p_level then
    return p_level;
  end if;

  update public.products set stock = p_level where id = p_product_id;

  insert into public.stock_movements
    (product_id, product_slug, product_name, delta, stock_after, reason, note, actor)
  values (
    prod.id, prod.slug, prod.name,
    p_level - coalesce(prod.stock, 0),
    p_level,
    case when prod.stock is null then 'initial' else 'stocktake' end,
    nullif(btrim(p_note), ''),
    p_actor
  );

  return p_level;
end;
$$;


-- -----------------------------------------------------------------------------
-- receive_stock: a delivery with several lines, all or nothing.
-- p_lines: [{"productId": "…", "qty": 12}, …]
-- -----------------------------------------------------------------------------
create or replace function public.receive_stock(
  p_lines jsonb,
  p_note  text default null,
  p_actor text default 'system'
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  batch uuid := gen_random_uuid();
  line  jsonb;
  qty   integer;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'receive_stock: no lines' using errcode = '22023';
  end if;

  for line in select * from jsonb_array_elements(p_lines) loop
    qty := (line ->> 'qty')::integer;
    if qty is null or qty <= 0 then
      raise exception 'receive_stock: every line needs a quantity above zero' using errcode = '22023';
    end if;
    perform public.adjust_stock((line ->> 'productId')::uuid, qty, 'restock', p_note, p_actor, batch);
  end loop;

  return batch;
end;
$$;


-- -----------------------------------------------------------------------------
-- apply_order_stock: take a paid order's lines off the shelf. Idempotent —
-- guarded by orders.stock_applied_at, so a webhook delivered three times
-- deducts once. Uncounted products are skipped. Returns lines deducted.
-- -----------------------------------------------------------------------------
create or replace function public.apply_order_stock(
  p_reference text,
  p_actor     text default 'system'
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  o       public.orders;
  line    jsonb;
  prod    public.products;
  qty     integer;
  level   integer;
  applied integer := 0;
begin
  update public.orders
     set stock_applied_at = now()
   where reference = p_reference and stock_applied_at is null
  returning * into o;
  if not found then
    return 0;
  end if;

  for line in select * from jsonb_array_elements(o.items) loop
    qty := (line ->> 'qty')::integer;
    prod := null;
    if line ? 'productId' then
      select * into prod from public.products where id = (line ->> 'productId')::uuid for update;
    end if;
    if prod.id is null then
      select * into prod from public.products where slug = line ->> 'slug' for update;
    end if;
    continue when prod.id is null or prod.stock is null or qty is null or qty <= 0;

    update public.products set stock = stock - qty where id = prod.id returning stock into level;
    insert into public.stock_movements
      (product_id, product_slug, product_name, delta, stock_after, reason, order_reference, actor)
    values
      (prod.id, prod.slug, prod.name, -qty, level, 'sale', p_reference, p_actor);
    applied := applied + 1;
  end loop;

  if applied > 0 then
    insert into public.order_events (order_reference, kind, message, actor)
    values (p_reference, 'stock_applied', format('Stock deducted for %s line(s)', applied), p_actor);
  end if;

  return applied;
end;
$$;


-- -----------------------------------------------------------------------------
-- restore_order_stock: put a cancelled order's lines back. Idempotent, and a
-- no-op for an order whose stock was never taken.
-- -----------------------------------------------------------------------------
create or replace function public.restore_order_stock(
  p_reference text,
  p_actor     text default 'system'
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  o        public.orders;
  mv       public.stock_movements;
  level    integer;
  restored integer := 0;
begin
  update public.orders
     set stock_restored_at = now()
   where reference = p_reference and stock_applied_at is not null and stock_restored_at is null
  returning * into o;
  if not found then
    return 0;
  end if;

  -- Reverse exactly what the sale took, from the ledger, rather than
  -- re-reading the order's lines: that way a product renamed since is still
  -- found, and nothing is put back that was never taken.
  for mv in
    select * from public.stock_movements
     where order_reference = p_reference and reason = 'sale' and product_id is not null
  loop
    update public.products set stock = stock - mv.delta
     where id = mv.product_id and stock is not null
    returning stock into level;
    continue when not found;
    insert into public.stock_movements
      (product_id, product_slug, product_name, delta, stock_after, reason, order_reference, actor)
    values
      (mv.product_id, mv.product_slug, mv.product_name, -mv.delta, level, 'cancellation', p_reference, p_actor);
    restored := restored + 1;
  end loop;

  if restored > 0 then
    insert into public.order_events (order_reference, kind, message, actor)
    values (p_reference, 'stock_restored', format('Stock returned to the shelf for %s line(s)', restored), p_actor);
  end if;

  return restored;
end;
$$;


-- -----------------------------------------------------------------------------
-- settle_order: record what the payment provider says happened. Idempotent:
-- only a pending order moves, under a row lock, so the webhook and the
-- callback page can race and whichever arrives first wins. The amount is
-- checked, not trusted. A paid order has its stock taken in the same
-- transaction.
-- Returns {"outcome": "settled" | "already" | "missing", "order": {…}}.
-- -----------------------------------------------------------------------------
create or replace function public.settle_order(
  p_reference text,
  p_paid      boolean,
  p_amount    integer,
  p_channel   text,
  p_paid_at   timestamptz,
  p_actor     text default 'paystack'
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o          public.orders;
  new_status text;
begin
  select * into o from public.orders where reference = p_reference for update;
  if not found then
    return jsonb_build_object('outcome', 'missing');
  end if;
  if o.status <> 'pending' then
    return jsonb_build_object('outcome', 'already', 'order', to_jsonb(o));
  end if;

  new_status := case
    when not p_paid then 'failed'
    when p_amount is not null and p_amount <> o.total then 'mismatch'
    else 'paid'
  end;

  update public.orders
     set status = new_status, paid_amount = p_amount, paid_channel = p_channel, paid_at = p_paid_at
   where reference = p_reference
  returning * into o;

  insert into public.order_events (order_reference, kind, message, actor)
  values (
    p_reference,
    case new_status when 'paid' then 'paid' when 'failed' then 'payment_failed' else 'mismatch' end,
    case new_status
      when 'paid' then format('Paid ₦%s by %s', to_char(p_amount, 'FM999,999,999,999'), coalesce(p_channel, 'unknown channel'))
      when 'failed' then 'Payment did not complete'
      else format('Paid ₦%s against a total of ₦%s — check before shipping',
                  to_char(p_amount, 'FM999,999,999,999'), to_char(o.total, 'FM999,999,999,999'))
    end,
    p_actor
  );

  if new_status = 'paid' then
    perform public.apply_order_stock(p_reference, p_actor);
  end if;

  select * into o from public.orders where reference = p_reference;
  return jsonb_build_object('outcome', 'settled', 'order', to_jsonb(o));
end;
$$;


-- -----------------------------------------------------------------------------
-- record_payment: staff record a payment taken off-line (cash at the counter,
-- a bank transfer, POS), or accept a mismatched payment after checking it.
-- -----------------------------------------------------------------------------
create or replace function public.record_payment(
  p_reference text,
  p_amount    integer,
  p_channel   text,
  p_note      text default null,
  p_actor     text default 'system'
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where reference = p_reference for update;
  if not found then
    raise exception 'record_payment: no order %', p_reference using errcode = 'P0002';
  end if;
  if o.status not in ('pending', 'failed', 'mismatch') then
    raise exception 'record_payment: order % is already %', p_reference, o.status using errcode = '22023';
  end if;
  if o.fulfilment = 'cancelled' then
    raise exception 'record_payment: order % was cancelled', p_reference using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'record_payment: amount must be above zero' using errcode = '22023';
  end if;

  update public.orders
     set status = 'paid',
         paid_amount = p_amount,
         paid_channel = coalesce(nullif(btrim(p_channel), ''), paid_channel, 'manual'),
         paid_at = coalesce(paid_at, now())
   where reference = p_reference
  returning * into o;

  insert into public.order_events (order_reference, kind, message, actor)
  values (
    p_reference,
    'payment_recorded',
    format('Payment of ₦%s recorded (%s)%s', to_char(p_amount, 'FM999,999,999,999'), o.paid_channel,
           case when nullif(btrim(p_note), '') is null then '' else ': ' || btrim(p_note) end),
    p_actor
  );

  perform public.apply_order_stock(p_reference, p_actor);

  select * into o from public.orders where reference = p_reference;
  return to_jsonb(o);
end;
$$;


-- -----------------------------------------------------------------------------
-- set_fulfilment: packed, shipped (with tracking), delivered. Cancelling goes
-- through cancel_order, because it has to put stock back.
-- -----------------------------------------------------------------------------
create or replace function public.set_fulfilment(
  p_reference  text,
  p_fulfilment text,
  p_tracking   text default null,
  p_actor      text default 'system'
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o public.orders;
begin
  if p_fulfilment not in ('unfulfilled', 'packed', 'shipped', 'delivered') then
    raise exception 'set_fulfilment: % is not a fulfilment step (cancel with cancel_order)', p_fulfilment
      using errcode = '22023';
  end if;

  select * into o from public.orders where reference = p_reference for update;
  if not found then
    raise exception 'set_fulfilment: no order %', p_reference using errcode = 'P0002';
  end if;
  if o.fulfilment = 'cancelled' then
    raise exception 'set_fulfilment: order % was cancelled', p_reference using errcode = '22023';
  end if;

  if o.fulfilment = p_fulfilment and o.tracking is not distinct from nullif(btrim(p_tracking), '') then
    return to_jsonb(o);
  end if;

  update public.orders
     set fulfilment = p_fulfilment,
         tracking = coalesce(nullif(btrim(p_tracking), ''), tracking)
   where reference = p_reference
  returning * into o;

  insert into public.order_events (order_reference, kind, message, actor)
  values (
    p_reference,
    'fulfilment',
    case p_fulfilment
      when 'unfulfilled' then 'Marked unfulfilled'
      when 'packed' then 'Packed'
      when 'shipped' then 'Shipped' || coalesce(' — ' || o.tracking, '')
      else 'Delivered'
    end,
    p_actor
  );

  return to_jsonb(o);
end;
$$;


-- -----------------------------------------------------------------------------
-- cancel_order: terminal. Puts any stock the order took back on the shelf, and
-- optionally records that the money was refunded.
-- -----------------------------------------------------------------------------
create or replace function public.cancel_order(
  p_reference text,
  p_refunded  boolean default false,
  p_note      text default null,
  p_actor     text default 'system'
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where reference = p_reference for update;
  if not found then
    raise exception 'cancel_order: no order %', p_reference using errcode = 'P0002';
  end if;
  if o.fulfilment = 'cancelled' then
    return to_jsonb(o);
  end if;
  if o.fulfilment in ('shipped', 'delivered') then
    raise exception 'cancel_order: order % has already %; record a return instead', p_reference, o.fulfilment
      using errcode = '22023';
  end if;

  update public.orders
     set fulfilment = 'cancelled',
         status = case when p_refunded and status in ('paid', 'mismatch') then 'refunded' else status end
   where reference = p_reference
  returning * into o;

  insert into public.order_events (order_reference, kind, message, actor)
  values (
    p_reference,
    'cancelled',
    'Cancelled' || case when p_refunded and o.status = 'refunded' then ' and refunded' else '' end
      || case when nullif(btrim(p_note), '') is null then '' else ': ' || btrim(p_note) end,
    p_actor
  );

  perform public.restore_order_stock(p_reference, p_actor);

  select * into o from public.orders where reference = p_reference;
  return to_jsonb(o);
end;
$$;


-- -----------------------------------------------------------------------------
-- import_products: seed an empty products table from the bundled catalogue,
-- all or nothing. Counted lines get an 'initial' ledger entry.
-- -----------------------------------------------------------------------------
create or replace function public.import_products(
  p_products jsonb,
  p_actor    text default 'system'
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  item  jsonb;
  pos   integer := 0;
  prod  public.products;
begin
  if exists (select 1 from public.products) then
    raise exception 'import_products: the products table is not empty' using errcode = '23505';
  end if;

  for item in select * from jsonb_array_elements(p_products) loop
    pos := pos + 1;
    insert into public.products
      (slug, name, sku, woo_id, status, categories, summary, description, price, compare_at,
       stock, in_stock, specs, tags, images, variants, featured, position)
    values (
      item ->> 'slug',
      item ->> 'name',
      coalesce(item ->> 'sku', ''),
      nullif(item ->> 'wooId', ''),
      'active',
      array(select jsonb_array_elements_text(coalesce(item -> 'categories', '[]'))),
      coalesce(item ->> 'summary', ''),
      array(select jsonb_array_elements_text(coalesce(item -> 'description', '[]'))),
      (item ->> 'price')::integer,
      (item ->> 'compareAt')::integer,
      (item ->> 'stock')::integer,
      coalesce((item ->> 'inStock')::boolean, true),
      coalesce(item -> 'specs', '[]'),
      array(select jsonb_array_elements_text(coalesce(item -> 'tags', '[]'))),
      array(select jsonb_array_elements_text(coalesce(item -> 'images', '[]'))),
      case when jsonb_typeof(item -> 'variants') = 'array' then item -> 'variants' end,
      coalesce((item ->> 'featured')::boolean, false),
      pos
    )
    returning * into prod;

    if prod.stock is not null then
      insert into public.stock_movements
        (product_id, product_slug, product_name, delta, stock_after, reason, note, actor)
      values
        (prod.id, prod.slug, prod.name, prod.stock, prod.stock, 'initial', 'Imported from the catalogue', p_actor);
    end if;
  end loop;

  return pos;
end;
$$;


-- =============================================================================
-- Customers
-- =============================================================================
--
-- There are no customer accounts: a customer is everyone who has ordered with
-- the same email address. security_invoker makes the view run with the
-- caller's rights, so it is exactly as private as the orders table under it —
-- without it, a view runs as its owner and would read straight past RLS.
--
-- paid_orders and spent count what the reports call a sale: paid, and not
-- cancelled since — money the shop kept. phone_digits holds every number the
-- customer has used, digits only, so the admin can find them by any of them.
-- (New columns go on the end: create or replace view cannot reorder.)

create or replace view public.customer_summaries
with (security_invoker = true)
as
select
  lower(customer_email)                                          as email,
  (array_agg(customer_name  order by created_at desc))[1]        as name,
  (array_agg(customer_phone order by created_at desc))[1]        as phone,
  (array_agg(city           order by created_at desc))[1]        as city,
  (array_agg(state          order by created_at desc))[1]        as state,
  count(*)::integer                                              as orders,
  (count(*) filter (where status = 'paid' and fulfilment <> 'cancelled'))::integer
                                                                 as paid_orders,
  coalesce(sum(total) filter (where status = 'paid' and fulfilment <> 'cancelled'), 0)::bigint
                                                                 as spent,
  min(created_at)                                                as first_order_at,
  max(created_at)                                                as last_order_at,
  string_agg(distinct phone_digits, ' ')                         as phone_digits
from public.orders
group by lower(customer_email);


-- =============================================================================
-- Lock it down
-- =============================================================================

alter table public.orders          enable row level security;
alter table public.order_events    enable row level security;
alter table public.products        enable row level security;
alter table public.stock_movements enable row level security;

-- RLS with no policies already returns nothing to the anon key. Revoking the
-- privileges as well means a policy added by mistake later still exposes
-- nothing: the role would not be allowed to touch the table at all.
revoke all on table public.orders, public.order_events, public.products,
                    public.stock_movements, public.customer_summaries
  from anon, authenticated;

grant all on table public.orders, public.order_events, public.products,
                   public.stock_movements, public.customer_summaries
  to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Postgres lets everyone execute a new function, and PostgREST publishes
-- every function in `public` at /rest/v1/rpc/<name> — so without this, the
-- anon key could call adjust_stock. Only the server's role may.
do $$
declare
  fn text;
begin
  for fn in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('adjust_stock', 'set_stock', 'receive_stock', 'apply_order_stock',
                         'restore_order_stock', 'settle_order', 'record_payment', 'set_fulfilment',
                         'cancel_order', 'import_products', 'touch_updated_at', 'log_order_placed')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end $$;


-- =============================================================================
-- Product photos
-- =============================================================================
--
-- A public bucket: anyone can read a product photo (they are on the shop
-- floor), but only the service role can write, because Supabase Storage
-- denies writes that no storage policy allows, and none is created here.

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('product-images', 'product-images', true)
    on conflict (id) do update set public = true;
  end if;
end $$;
