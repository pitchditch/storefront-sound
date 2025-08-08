export const config = { runtime: "edge" };

function corsHeaders(req: Request, methods: string[]) {
  const reqHeaders = req.headers.get("access-control-request-headers") || "Content-Type, Authorization, X-Requested-With, x-health-check";
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods.join(", "),
    "Access-Control-Allow-Headers": reqHeaders,
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

export default async function handler(req: Request): Promise<Response> {
  const cors = corsHeaders(req, ["GET", "POST", "OPTIONS"]);
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json", ...cors },
      });
    }

    const { toPhoneNumber, businessName, notes } = await req.json().catch(() => ({} as any));
    if (!toPhoneNumber) {
      return new Response(JSON.stringify({ error: "Missing toPhoneNumber" }), {
        status: 400,
        headers: { "content-type": "application/json", ...cors },
      });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;

    if (!sid || !token || !fromNumber || !publicBaseUrl) {
      return new Response(JSON.stringify({ error: "Missing required environment variables" }), {
        status: 500,
        headers: { "content-type": "application/json", ...cors },
      });
    }

    const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;
    const twimlWebhookUrl = `${publicBaseUrl}/api/twiml`;

    const form = new URLSearchParams({
      To: toPhoneNumber,
      From: fromNumber,
      Url: twimlWebhookUrl,
    });

    const basic = btoa(new TextDecoder().decode(new Uint8Array(new TextEncoder().encode(`${sid}:${token}`))));

    const r = await fetch(twilioURL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const result = await r.json().catch(() => ({ error: "Invalid JSON from Twilio" }));

    return new Response(JSON.stringify(result), {
      status: r.ok ? 200 : 400,
      headers: { "content-type": "application/json", ...cors },
    });
  } catch (err: any) {
    console.error("trigger-call error:", err);
    return new Response(JSON.stringify({ error: "Function crashed", detail: String(err?.message || err) }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors },
    });
  }
}
