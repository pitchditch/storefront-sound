import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for browser-based health checks
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  if (req.method === "OPTIONS") return res.status(200).end();

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(`
    <Response>
      <Say>Test OK. Your Twilio to Vercel path works.</Say>
      <Pause length="2"/>
      <Say>Hanging up now.</Say>
    </Response>
  `.trim());
}
