// /api/trigger-call.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Health-Check");
}

function getBaseUrl(req: VercelRequest): string | undefined {
  const host = req.headers.host;
  if (!host) return undefined;
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

function isE164(phone?: string) {
  return typeof phone === "string" && /^\+\d{8,15}$/.test(phone);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const isHealthCheck =
      req.headers["x-health-check"] === "true" || req.headers["x-health-check"] === "1";
    if (isHealthCheck) return res.status(200).json({ ok: true, message: "trigger-call reachable" });

    // Body can arrive as string or object; normalize
    const raw = (req.body ?? {}) as any;
    const bodyObj = typeof raw === "string" ? JSON.parse(raw) : raw;

    const { toPhoneNumber, businessName, notes } = (bodyObj ?? {}) as {
      toPhoneNumber?: string; businessName?: string; notes?: string;
    };

    if (!isE164(toPhoneNumber)) {
      return res.status(400).json({ error: "Missing or invalid toPhoneNumber (E.164 e.g. +15551234567)" });
    }

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_FROM_NUMBER,
      PUBLIC_BASE_URL
    } = process.env as Record<string, string | undefined>;

    const baseUrl = PUBLIC_BASE_URL || getBaseUrl(req);
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !baseUrl) {
      return res.status(500).json({ error: "Missing required environment variables" });
    }

    const twimlWebhookUrl = `${baseUrl.replace(/\/$/, "")}/api/twiml`;
    const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

    const form = new URLSearchParams({
      To: toPhoneNumber,
      From: TWILIO_FROM_NUMBER,
      Url: twimlWebhookUrl
    });
    // Optional metadata:
    // form.append("StatusCallback", `${baseUrl}/api/status`);
    // form.append("StatusCallbackEvent", "initiated ringing answered completed");

    const r = await fetch(twilioURL, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });

    const text = await r.text();
    try {
      return res.status(r.ok ? 200 : r.status).json(JSON.parse(text));
    } catch {
      return res.status(r.ok ? 200 : r.status).send(text);
    }
  } catch (err: any) {
    console.error("trigger-call error:", err);
    return res.status(500).json({ error: "Function crashed", detail: String(err?.message || err) });
  }
}
