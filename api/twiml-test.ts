import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(`
    <Response>
      <Say>Test OK. Your Twilio to Vercel path works.</Say>
      <Pause length="2"/>
      <Say>Hanging up now.</Say>
    </Response>
  `.trim());
}
