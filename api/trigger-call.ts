import type { VercelRequest, VercelResponse } from "@vercel/node";

function setCors(req: VercelRequest, res: VercelResponse) {
  const reqHeaders = (req.headers["access-control-request-headers"] as string) || "";
  const allowHeaders = reqHeaders || "Content-Type, Authorization, X-Requested-With, x-health-check";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { toPhoneNumber, businessName, notes } = req.body || {};
    if (!toPhoneNumber) return res.status(400).json({ error: "Missing toPhoneNumber" });

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, PUBLIC_BASE_URL } = process.env as Record<string, string | undefined>;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !PUBLIC_BASE_URL) {
      return res.status(500).json({ error: "Missing required environment variables" });
    }

    const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const twimlWebhookUrl = `${PUBLIC_BASE_URL}/api/twiml`;

    const form = new URLSearchParams({
      To: toPhoneNumber,
      From: TWILIO_FROM_NUMBER,
      Url: twimlWebhookUrl,
    });

    const r = await fetch(twilioURL, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const result = await r.json();
    // Forward Twilio response (includes `sid`)
    return res.status(r.ok ? 200 : 400).json(result);
  } catch (err: any) {
    console.error("trigger-call error:", err);
    return res.status(500).json({ error: "Function crashed", detail: String(err?.message || err) });
  }
}
