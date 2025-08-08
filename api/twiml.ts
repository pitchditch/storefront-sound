import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { runtime: "nodejs20.x" };

function setCors(req: VercelRequest, res: VercelResponse) {
  const reqHeaders = (req.headers["access-control-request-headers"] as string) || "";
  const allowHeaders = reqHeaders || "Content-Type, Authorization, X-Requested-With, x-health-check";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
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
