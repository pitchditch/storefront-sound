import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID || "agent_8801k1zkfgxbe6k86btzyhxmzga2";
    const xml = `
      <Response>
        <Connect>
          <Stream url="wss://api.elevenlabs.io/v1/stream/agent/${agentId}"/>
        </Connect>
      </Response>
    `.trim();

    res.setHeader("Content-Type", "text/xml");
    res.status(200).send(xml);
  } catch (err: any) {
    console.error("twiml error:", err);
    res.status(500).send(`<Response><Say>Server error.</Say></Response>`);
  }
}
