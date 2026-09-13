const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Prices are held in whole naira, never kobo, until the payment boundary. */
export function formatNaira(amount: number): string {
  return naira.format(amount);
}

/** Paystack charges in kobo. */
export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}
