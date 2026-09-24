import { Badge } from "@/components/admin/ui";
import type { ProductStatus, StockState } from "@/lib/admin/products";

/**
 * One vocabulary for state across the admin. The colours carry the same
 * meaning everywhere: green is done or healthy, gold wants attention soon,
 * red needs a person now, grey is inert.
 */

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  if (status === "active") return <Badge tone="earth">Live</Badge>;
  if (status === "draft") return <Badge tone="muted">Draft</Badge>;
  return <Badge tone="muted">In trash</Badge>;
}

export function StockBadge({
  state,
  stock,
  inStock,
}: {
  state: StockState;
  stock: number | null;
  inStock: boolean;
}) {
  if (stock == null) {
    return inStock ? <Badge tone="muted">Not counted</Badge> : <Badge tone="warn">Unavailable</Badge>;
  }
  if (stock < 0) return <Badge tone="warn">Oversold {stock}</Badge>;
  if (state === "out") return <Badge tone="warn">Out · {stock}</Badge>;
  if (state === "low") return <Badge tone="live">Low · {stock}</Badge>;
  return <Badge tone="earth">In stock · {stock}</Badge>;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "mismatch" | "refunded";
export type Fulfilment = "unfulfilled" | "packed" | "shipped" | "delivered" | "cancelled";

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  mismatch: "Amount mismatch",
  refunded: "Refunded",
};

export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  unfulfilled: "To pack",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone = { paid: "earth", pending: "muted", failed: "warn", mismatch: "warn", refunded: "muted" } as const;
  return <Badge tone={tone[status]}>{PAYMENT_LABEL[status]}</Badge>;
}

export function FulfilmentBadge({ fulfilment, paid }: { fulfilment: Fulfilment; paid: boolean }) {
  // "To pack" only needs someone once the money is in.
  const tone =
    fulfilment === "delivered"
      ? "earth"
      : fulfilment === "cancelled"
        ? "muted"
        : fulfilment === "shipped"
          ? "neutral"
          : paid
            ? "live"
            : "muted";
  return <Badge tone={tone}>{FULFILMENT_LABEL[fulfilment]}</Badge>;
}
