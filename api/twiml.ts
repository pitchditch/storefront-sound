// /api/twiml.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "text/xml");

  try {
    const agentId  = process.env.ELEVENLABS_AGENT_ID;
    const apiKey   = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return res
        .status(500)
        .send(`<Response><Say>Server missing AI credentials.</Say></Response>`);
    }

    // Try signed URL first (preferred)
    let signedUrl: string | null = null;
    try {
      const r = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(
          agentId
        )}`,
        { headers: { "xi-api-key": apiKey } }
      );
      if (r.ok) {
        const j = (await r.json()) as { signed_url?: string };
        if (j?.signed_url) signedUrl = j.signed_url;
      } else {
        const txt = await r.text().catch(() => "");
        console.error("get_signed_url failed:", r.status, txt);
      }
    } catch (e) {
      console.error("get_signed_url error:", e);
    }

    // Build TwiML
    let xml: string;
    if (signedUrl) {
      xml = `
        <Response>
          <Connect>
            <Stream url="wss://api.elevenlabs.io/v1/convai/stream">
              <Parameter name="agent_id" value="${xmlEscape(agentId)}"/>
              <Parameter name="signed_url" value="${xmlEscape(signedUrl)}"/>
            </Stream>
          </Connect>
        </Response>
      `.trim();
    } else {
      // Fallback: direct agent stream
      xml = `
        <Response>
          <Connect>
            <Stream url="wss://api.elevenlabs.io/v1/stream/agent/${xmlEscape(agentId)}"/>
          </Connect>
        </Response>
      `.trim();
    }

    return res.status(200).send(xml);
  } catch (err) {
    console.error("twiml error:", err);
    return res.status(500).send(`<Response><Say>Application error. Goodbye.</Say></Response>`);
  }
}
