import type { VercelRequest, VercelResponse } from "@vercel/node";
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    envPresent: {
      PUBLIC_BASE_URL: !!process.env.PUBLIC_BASE_URL,
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_FROM_NUMBER: !!process.env.TWILIO_FROM_NUMBER,
      ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
      ELEVENLABS_AGENT_ID: !!process.env.ELEVENLABS_AGENT_ID,
    },
  });
}
