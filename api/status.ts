// /api/status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
}

function parseBody(body: any): Record<string, any> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      const params = new URLSearchParams(body);
      return Object.fromEntries(params.entries());
    } catch {
      return { raw: body };
    }
  }
  if (typeof body === "object") return body as Record<string, any>;
  return { raw: String(body) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "status endpoint reachable" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = parseBody(req.body);
    console.log("Twilio StatusCallback:", data);

    // Respond quickly to Twilio
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("status error:", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
