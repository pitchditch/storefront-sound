// Edge runtime
export const config = { runtime: "edge" };

function setCors(res: ResponseInit): ResponseInit {
  return {
    ...res,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Health-Check",
      ...(res.headers as any),
    },
  };
}

function isE164(p?: string) {
  return typeof p === "string" && /^\+\d{8,15}$/.test(p);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, setCors({ status: 200 }));
  if (req.method !== "POST")
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      setCors({ status: 405 })
    );

  // health probe
  if (req.headers.get("x-health-check")) {
    return new Response(
      JSON.stringify({ ok: true, message: "trigger-call reachable" }),
      setCors({ status: 200, headers: { "Content-Type": "application/json" } })
    );
  }

  try {
    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};
    const toPhoneNumber = body?.toPhoneNumber as string;

    if (!isE164(toPhoneNumber)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid toPhoneNumber (E.164)" }),
        setCors({ status: 400, headers: { "Content-Type": "application/json" } })
      );
    }

    const env = process.env as Record<string, string | undefined>;
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, PUBLIC_BASE_URL } = env;

    // derive base if not set
    const base = PUBLIC_BASE_URL ?? `https://${new URL(req.url).host}`;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !base) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        setCors({ status: 500, headers: { "Content-Type": "application/json" } })
      );
    }

    const twimlWebhookUrl = `${base.replace(/\/$/, "")}/api/twiml`;
    const statusCallbackUrl = `${base.replace(/\/$/, "")}/api/status`;
    const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

    const form = new URLSearchParams();
    form.append("To", toPhoneNumber);
    form.append("From", TWILIO_FROM_NUMBER);
    form.append("Url", twimlWebhookUrl);
    form.append("StatusCallback", statusCallbackUrl);
    form.append("StatusCallbackMethod", "POST");
    form.append("StatusCallbackEvent", "initiated");
    form.append("StatusCallbackEvent", "ringing");
    form.append("StatusCallbackEvent", "answered");
    form.append("StatusCallbackEvent", "completed");

    // Basic auth in Edge: use btoa
    const auth = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const r = await fetch(twilioURL, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const text = await r.text();
    let payload: any = text;
    try {
      payload = JSON.parse(text);
    } catch {}

    const isJson = typeof payload !== "string";
    return new Response(
      isJson ? JSON.stringify(payload) : payload,
      setCors({
        status: r.ok ? 200 : r.status,
        headers: { "Content-Type": isJson ? "application/json" : "text/plain" },
      })
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "Function crashed", detail: String(e?.message || e) }),
      setCors({ status: 500, headers: { "Content-Type": "application/json" } })
    );
  }
}
