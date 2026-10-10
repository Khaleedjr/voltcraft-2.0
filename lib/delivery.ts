/**
 * Delivery fees, by the state the order goes to.
 *
 * The fees are the old WooCommerce shop's, read from its own checkout
 * (October 2026): one flat fee per state, however much is in the order; the
 * city within a state makes no difference. Delivery is free everywhere once
 * the goods come to ₦100,000: the owner's rule (the old shop only waived it
 * at that amount in Kaduna, and at ₦150,000 elsewhere).
 *
 * The old shop offered no delivery at all to nine states. They are marked
 * `assumed` below with the fee of their neighbours, so an order from there
 * can still go through; the owner should confirm or change those.
 *
 * This module imports nothing, so both the browser (cart and checkout
 * summaries) and the server (the charge itself) price delivery from the same
 * table.
 */

/** Free delivery, to every state, once the goods in an order come to this. */
export const FREE_DELIVERY_FROM = 100_000;

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT — Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

export type DeliveryRate = { fee: number; freeFrom: number; assumed?: true };

const kaduna: DeliveryRate = { fee: 1_500, freeFrom: FREE_DELIVERY_FROM };
const near: DeliveryRate = { fee: 2_000, freeFrom: FREE_DELIVERY_FROM };
const north: DeliveryRate = { fee: 3_000, freeFrom: FREE_DELIVERY_FROM };
const south: DeliveryRate = { fee: 4_000, freeFrom: FREE_DELIVERY_FROM };
/** Not served by the old shop: the fee of the neighbouring states, until the owner says otherwise. */
const assumedNorth: DeliveryRate = { ...north, assumed: true };
const assumedSouth: DeliveryRate = { ...south, assumed: true };

export const DELIVERY_RATES: Record<NigerianState, DeliveryRate> = {
  Kaduna: kaduna,

  "FCT — Abuja": near,
  Bauchi: near,
  Kano: near,
  Katsina: near,
  Nasarawa: near,
  Niger: near,

  Adamawa: north,
  Borno: north,
  Gombe: north,
  Jigawa: north,
  Kebbi: north,
  Kogi: north,
  Plateau: north,
  Sokoto: north,
  Yobe: north,
  Zamfara: north,

  "Cross River": south,
  Delta: south,
  Edo: south,
  Enugu: south,
  Imo: south,
  Lagos: south,
  Ogun: south,
  Ondo: south,
  Osun: south,
  Oyo: south,
  Rivers: south,

  Benue: assumedNorth,
  Kwara: assumedNorth,
  Taraba: assumedNorth,
  Abia: assumedSouth,
  "Akwa Ibom": assumedSouth,
  Anambra: assumedSouth,
  Bayelsa: assumedSouth,
  Ebonyi: assumedSouth,
  Ekiti: assumedSouth,
};

export const LOWEST_DELIVERY_FEE = Math.min(...Object.values(DELIVERY_RATES).map((r) => r.fee));

export function isNigerianState(value: string): value is NigerianState {
  return (NIGERIAN_STATES as readonly string[]).includes(value);
}

/**
 * What delivery to `state` costs on goods worth `subtotal`: the state's fee,
 * or nothing once the goods reach its free-delivery amount. Null for a state
 * that is not on the list, which is not priced (and not sold to).
 */
export function deliveryFor(state: string, subtotal: number): { fee: number; free: boolean } | null {
  if (!isNigerianState(state)) return null;
  const rate = DELIVERY_RATES[state];
  const free = subtotal >= rate.freeFrom;
  return { fee: free ? 0 : rate.fee, free };
}

/** The fees as a table for people: each fee with the states it covers, cheapest first. */
export function deliveryTable(): { fee: number; freeFrom: number; states: NigerianState[] }[] {
  const rows = new Map<string, { fee: number; freeFrom: number; states: NigerianState[] }>();
  for (const state of NIGERIAN_STATES) {
    const { fee, freeFrom } = DELIVERY_RATES[state];
    const key = `${fee}/${freeFrom}`;
    const row = rows.get(key) ?? { fee, freeFrom, states: [] };
    row.states.push(state);
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => a.fee - b.fee);
}
