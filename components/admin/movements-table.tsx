import Link from "next/link";
import { Badge, table } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { REASONS, type Movement } from "@/lib/admin/stock";

/** Rows of the stock ledger. Used on the stock page and under each product. */
export function MovementsTable({ rows, showProduct = true }: { rows: Movement[]; showProduct?: boolean }) {
  return (
    <div className={table.wrap}>
      <table className={table.table}>
        <thead>
          <tr>
            <th className={table.th}>When</th>
            {showProduct ? <th className={table.th}>Product</th> : null}
            <th className={table.th}>Reason</th>
            <th className={table.thRight}>Change</th>
            <th className={table.thRight}>Left</th>
            <th className={table.th}>Note</th>
            <th className={table.th}>By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const reason = REASONS[m.reason];
            const tone = m.reason === "sale" ? "neutral" : m.delta > 0 ? "earth" : m.reason === "damage" ? "warn" : "muted";
            return (
              <tr key={m.id} className={table.tr}>
                <td className={`${table.td} whitespace-nowrap text-[0.82rem] text-muted`}>{formatDateTime(m.createdAt)}</td>
                {showProduct ? (
                  <td className={table.td}>
                    {m.productId ? (
                      <Link href={`/admin/products/${m.productId}`} className="font-semibold hover:text-live">
                        {m.productName}
                      </Link>
                    ) : (
                      <span className="text-muted" title="This product has since been deleted">
                        {m.productName}
                      </span>
                    )}
                  </td>
                ) : null}
                <td className={table.td}>
                  <Badge tone={tone} dot={false}>
                    {reason.label}
                  </Badge>
                </td>
                <td className={`${table.tdRight} ${m.delta > 0 ? "text-earth" : "text-warn"}`}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </td>
                <td className={table.tdRight}>{m.stockAfter ?? "—"}</td>
                <td className={`${table.td} max-w-[280px] text-[0.84rem] text-muted`}>
                  {m.orderReference ? (
                    <Link href={`/admin/orders/${m.orderReference}`} className="font-mono text-[0.8rem] text-ink hover:text-live">
                      {m.orderReference}
                    </Link>
                  ) : null}
                  {m.orderReference && m.note ? " · " : null}
                  {m.note}
                </td>
                <td className={`${table.td} whitespace-nowrap text-[0.82rem] text-faint`}>{m.actor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
