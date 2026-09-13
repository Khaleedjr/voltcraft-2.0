import { NextResponse } from "next/server";

/**
 * Contact form endpoint.
 *
 * Delivery is intentionally pluggable: set CONTACT_WEBHOOK_URL to any endpoint
 * that accepts JSON (a mail service, a Slack/Discord webhook, a CRM). Until
 * that is configured the route says so plainly instead of pretending the
 * message was sent — a silently dropped enquiry is worse than no form.
 */

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function parse(body: unknown): ContactPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const fields = ["name", "email", "subject", "message"] as const;
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = b[f];
    if (typeof v !== "string" || v.trim().length === 0) return null;
    if (v.length > 5000) return null;
    out[f] = v.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return null;
  return out as ContactPayload;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const payload = parse(body);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Please fill in every field and use a valid email address." },
      { status: 400 },
    );
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      {
        ok: false,
        error: "The message service isn't connected yet. Please email or call us instead.",
        unconfigured: true,
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "voltcraft.org.ng/contact", ...payload }),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  } catch (error) {
    console.error("[contact] delivery failed", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't send that just now. Please email or call us instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
