import "server-only";

/**
 * Minimal Paystack client — initialise and verify, nothing else.
 *
 * Configure with PAYSTACK_SECRET_KEY (sk_test_… while developing). When the key
 * is absent every helper here reports "not configured" and checkout falls back
 * to placing the order for manual follow-up, so the flow stays usable before
 * payments are switched on.
 */

const API = "https://api.paystack.co";

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

type InitInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

type PaystackResponse<T> = { status: boolean; message: string; data: T };

export type InitResult = { authorizationUrl: string; reference: string };

export async function initializeTransaction(input: InitInput): Promise<InitResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackResponse<{
    authorization_url: string;
    reference: string;
  }>;

  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack returned ${res.status}`);
  }

  return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
}

export type VerifyResult = {
  status: "success" | "failed" | "pending" | "unknown";
  reference: string;
  amount: number; // naira
  paidAt: string | null;
  channel: string | null;
  customerEmail: string | null;
};

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { authorization: `Bearer ${secret}` },
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackResponse<{
    status: string;
    reference: string;
    amount: number;
    paid_at: string | null;
    channel: string | null;
    customer?: { email?: string };
  }>;

  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack returned ${res.status}`);
  }

  const raw = json.data.status;
  const status: VerifyResult["status"] =
    raw === "success" ? "success" : raw === "failed" ? "failed" : raw === "abandoned" ? "pending" : "unknown";

  return {
    status,
    reference: json.data.reference,
    amount: Math.round(json.data.amount / 100),
    paidAt: json.data.paid_at,
    channel: json.data.channel,
    customerEmail: json.data.customer?.email ?? null,
  };
}
