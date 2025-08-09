import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const apiKey  = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      res.setHeader("Content-Type", "text/xml");
      return res
        .status(500)
        .send(`<Response><Say>Server missing ElevenLabs credentials.</Say></Response>`);
    }

    // 1) Ask ElevenLabs for a fresh signed conversation token
    const r = await fetch("https://api.elevenlabs.io/v1/convai/conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      res.setHeader("Content-Type", "text/xml");
      return res
        .status(502)
        .send(`<Response><Say>Could not start agent.</Say></Response>`);
    }

    const data = (await r.json()) as { conversation_signature: string };
    const signedUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(
      agentId
    )}&conversation_signature=${encodeURIComponent(data.conversation_signature)}`;

    // 2) Give Twilio TwiML that streams to the signed URL
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
    return res
      .status(500)
      .send(`<Response><Say>Application error. Please try again later.</Say></Response>`);
  }
}
