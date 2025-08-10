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

    // 1) Get a signed URL for the conversation (short-lived URL authorizing the websocket)
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("ElevenLabs get_signed_url error:", resp.status, errText);
      res.setHeader("Content-Type", "text/xml");
      return res.status(502).send(`<Response><Say>Agent authorization failed.</Say></Response>`);
    }

    const { signed_url } = (await resp.json()) as { signed_url: string };

    // 2) Return TwiML instructing Twilio to open a media stream to ElevenLabs
    // Twilio will connect to the stream URL and pass our signed URL as a parameter.
    const xml = `
      <Response>
        <Connect>
          <Stream url="wss://api.elevenlabs.io/v1/convai/stream">
            <Parameter name="agent_id" value="${agentId}"/>
            <Parameter name="signed_url" value="${signed_url}"/>
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
