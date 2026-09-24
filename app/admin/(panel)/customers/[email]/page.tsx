import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FulfilmentBadge, PaymentBadge } from "@/components/admin/badges";
import { Icon } from "@/components/admin/icons";
import { NeedsDatabase } from "@/components/admin/needs-database";
import { Thumb } from "@/components/admin/thumb";
import { Badge, Detail, LinkButton, PageHeader, Panel, Stat, table } from "@/components/admin/ui";
import { channelName, isSale } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/auth";
import { getCustomer, productsBought } from "@/lib/admin/customers";
import { formatCount, formatDate, formatDateTime, formatRelative } from "@/lib/admin/format";
import { ordersForEmail } from "@/lib/admin/orders";
import { formatNaira } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";
import { isSupabaseConfigured } from "@/lib/supabase";

/** The email from the URL, or null if it is not one. */
function emailParam(raw: string): string | null {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  value = value.trim().toLowerCase();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(value) ? value : null;
}

export async function generateMetadata({ params }: PageProps<"/admin/customers/[email]">): Promise<Metadata> {
  const email = emailParam((await params).email);
  return { title: email ? `Customer ${email}` : "Customer" };
}

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[email]">) {
  await requireAdmin();
  if (!isSupabaseConfigured()) return <NeedsDatabase title="Customer" />;

  const email = emailParam((await params).email);
  if (!email) notFound();
  const [customer, orders] = await Promise.all([getCustomer(email), ordersForEmail(email, 500)]);
  if (!customer) notFound();

  const sales = orders.filter(isSale);
  const bought = productsBought(orders);
  const BOUGHT_SHOWN = 15;
  const units = sales.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0);
  const firstName = customer.name.split(" ")[0] ?? customer.name;
  // orders come newest first, so the first of each kind is the latest used
  const unique = <T,>(values: T[], key: (v: T) => string) => {
    const seen = new Map<string, T>();
    for (const v of values) if (!seen.has(key(v))) seen.set(key(v), v);
    return [...seen.values()];
  };
  const phones = unique(orders.map((o) => o.customerPhone.trim()), (p) => p.replace(/\D/g, "").slice(-10));
  const addresses = unique(orders, (o) => `${o.address}|${o.city}|${o.state}`.toLowerCase().replace(/\s+/g, " "));
  const channels = unique(sales.filter((o) => o.paidChannel), (o) => channelName(o.paidChannel).name).map((o) => channelName(o.paidChannel).name);
  const repeat = customer.paidOrders > 1;

  return (
    <div className="grid gap-6">
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={customer.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {repeat ? <Badge tone="earth">Repeat buyer</Badge> : customer.paidOrders === 1 ? <Badge tone="neutral">Bought once</Badge> : <Badge tone="muted">Never paid</Badge>}
            <span className="text-faint">
              {customer.email} · customer since {formatDate(customer.firstOrderAt)}
            </span>
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`mailto:${customer.email}`}>
              <Icon.Mail className="size-4" /> Email
            </LinkButton>
            <LinkButton href={whatsappLink(customer.phone, `Hello ${firstName}, this is VoltCraft.`)} target="_blank" rel="noreferrer">
              <Icon.Phone className="size-4" /> WhatsApp
            </LinkButton>
          </div>
        }
      />

      <Panel>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
          <Stat label="Spent" value={formatNaira(customer.spent)} note="paid orders, not cancelled" />
          <Stat
            label="Paid orders"
            value={formatCount(customer.paidOrders)}
            note={customer.orders !== customer.paidOrders ? `of ${formatCount(customer.orders)} placed` : `${formatCount(units)} items in all`}
          />
          <Stat label="Average order" value={customer.paidOrders ? formatNaira(Math.round(customer.spent / customer.paidOrders)) : "—"} />
          <Stat label="Last order" value={formatRelative(customer.lastOrderAt)} note={formatDateTime(customer.lastOrderAt)} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grid min-w-0 gap-6">
          <Panel title={`Orders · ${formatCount(orders.length)}`} flush>
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[700px]`}>
                <thead>
                  <tr>
                    <th className={table.th}>Order</th>
                    <th className={table.th}>Items</th>
                    <th className={table.thRight}>Total</th>
                    <th className={table.th}>Payment</th>
                    <th className={table.th}>Fulfilment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const n = o.items.reduce((m, i) => m + i.qty, 0);
                    return (
                      <tr key={o.reference} className={table.tr}>
                        <td className={table.td}>
                          <Link href={`/admin/orders/${o.reference}`} className="whitespace-nowrap font-mono text-[0.84rem] font-semibold hover:text-live">
                            {o.reference}
                          </Link>
                          <p className="text-[0.76rem] text-faint">{formatDateTime(o.createdAt)}</p>
                        </td>
                        <td className={`${table.td} max-w-[240px]`}>
                          <p className="truncate text-[0.84rem]">{o.items[0]?.name ?? "—"}</p>
                          <p className="text-[0.76rem] text-faint">
                            {n} unit{n === 1 ? "" : "s"}
                            {o.items.length > 1 ? ` · ${o.items.length} lines` : ""}
                          </p>
                        </td>
                        <td className={table.tdRight}>{formatNaira(o.total)}</td>
                        <td className={table.td}>
                          <PaymentBadge status={o.status} />
                        </td>
                        <td className={table.td}>
                          <FulfilmentBadge fulfilment={o.fulfilment} paid={o.status === "paid"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="What they buy" flush>
            {bought.length ? (
              <div className={table.wrap}>
                <table className={`${table.table} min-w-[560px]`}>
                  <thead>
                    <tr>
                      <th className={table.th}>Product</th>
                      <th className={table.thRight}>Units</th>
                      <th className={table.thRight}>Spent</th>
                      <th className={table.th}>Last bought</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bought.slice(0, BOUGHT_SHOWN).map((b) => (
                      <tr key={b.key} className={table.tr}>
                        <td className={table.td}>
                          <div className="flex items-center gap-3">
                            <Thumb src={b.image ?? undefined} alt="" size={36} />
                            {b.productId ? (
                              <Link href={`/admin/products/${b.productId}`} className="font-semibold leading-snug hover:text-live">
                                {b.name}
                              </Link>
                            ) : (
                              <span className="font-semibold leading-snug">{b.name}</span>
                            )}
                          </div>
                        </td>
                        <td className={table.tdRight}>{formatCount(b.units)}</td>
                        <td className={table.tdRight}>{formatNaira(b.spent)}</td>
                        <td className={`${table.td} text-[0.84rem] text-muted`}>{formatDate(b.lastAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bought.length > BOUGHT_SHOWN ? (
                  <p className="border-t border-line-soft px-4 py-3 text-[0.8rem] text-faint sm:px-5">
                    And {bought.length - BOUGHT_SHOWN} more product{bought.length - BOUGHT_SHOWN === 1 ? "" : "s"}, each for less.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-[0.86rem] text-faint">Nothing paid for yet.</p>
            )}
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title="Contact">
            <dl className="grid">
              <Detail label="Email">
                <a href={`mailto:${customer.email}`} className="hover:text-live">
                  {customer.email}
                </a>
              </Detail>
              <Detail label={phones.length > 1 ? "Phones" : "Phone"}>
                <ul className="grid gap-1">
                  {phones.map((p) => (
                    <li key={p}>
                      <a href={`tel:${p.replace(/\s/g, "")}`} className="whitespace-nowrap font-mono text-[0.84rem] hover:text-live">
                        {p}
                      </a>
                      <a href={whatsappLink(p)} target="_blank" rel="noreferrer" className="ml-3 text-[0.8rem] font-semibold text-earth hover:underline">
                        WhatsApp
                      </a>
                    </li>
                  ))}
                </ul>
              </Detail>
              {channels.length ? <Detail label="Pays by">{channels.join(", ")}</Detail> : null}
            </dl>
          </Panel>

          <Panel title={addresses.length > 1 ? `Delivery addresses · ${addresses.length}` : "Delivery address"}>
            <ul className="grid gap-4">
              {addresses.map((o) => (
                <li key={o.reference}>
                  <address className="text-[0.9rem] not-italic leading-relaxed">
                    {o.address}
                    <br />
                    {o.city}, {o.state}
                  </address>
                  <p className="mt-0.5 text-[0.74rem] text-faint">last used {formatDate(o.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
