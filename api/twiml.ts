// /api/twiml.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const agentId  = process.env.ELEVENLABS_AGENT_ID;
    const apiKey   = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      res.setHeader("Content-Type", "text/xml");
      return res.status(500).send(`<Response><Say>Server missing AI credentials.</Say></Response>`);
    }

    // 1) Create a conversation (returns a short-lived signature)
    const resp = await fetch("https://api.elevenlabs.io/v1/convai/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!resp.ok) {
      console.error("ElevenLabs convai error:", resp.status, await resp.text().catch(() => ""));
      res.setHeader("Content-Type", "text/xml");
      return res.status(502).send(`<Response><Say>Agent unavailable.</Say></Response>`);
    }

    const { conversation_signature } = await resp.json() as { conversation_signature: string };

    const signedUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(
      agentId
    )}&conversation_signature=${encodeURIComponent(conversation_signature)}`;

    // 2) Return TwiML instructing Twilio to open a media stream to ElevenLabs
    const xml = `
      <Response>
        <Connect>
          <Stream url="wss://api.elevenlabs.io/v1/convai/stream">
            <Parameter name="agent_id" value="${agentId}"/>
            <Parameter name="signed_url" value="${signedUrl}"/>
          </Stream>
        </Connect>
      </Response>
    `.trim();

    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("twiml error:", err);
    res.setHeader("Content-Type", "text/xml");
    return res.status(500).send(`<Response><Say>Application error. Goodbye.</Say></Response>`);
  }
}
