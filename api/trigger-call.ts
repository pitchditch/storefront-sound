// /api/trigger-call.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { toPhoneNumber, businessName, notes } = (req.body ?? {}) as {
      toPhoneNumber?: string;
      businessName?: string;
      notes?: string;
    };
    if (!toPhoneNumber) return res.status(400).json({ error: "Missing toPhoneNumber" });

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, PUBLIC_BASE_URL } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !PUBLIC_BASE_URL) {
      return res.status(500).json({ error: "Missing required environment variables" });
    }

    const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const twimlWebhookUrl = `${PUBLIC_BASE_URL}/api/twiml`; // this returns TwiML

    const form = new URLSearchParams({
      To: toPhoneNumber,
      From: TWILIO_FROM_NUMBER,
      Url: twimlWebhookUrl,
    });

    // Optional status callback for logging outcomes back to your app
    // form.append("StatusCallback", `${PUBLIC_BASE_URL}/api/status`);
    // form.append("StatusCallbackEvent", "initiated ringing answered completed");

    const r = await fetch(twilioURL, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const body = await r.text();
    // Try to parse Twilio JSON, fall back to text
    try {
      const json = JSON.parse(body);
      return res.status(r.ok ? 200 : r.status).json(json);
    } catch {
      return res.status(r.ok ? 200 : r.status).send(body);
    }
  } catch (err: any) {
    console.error("trigger-call error:", err);
    return res.status(500).json({ error: "Function crashed", detail: String(err?.message || err) });
  }
}
