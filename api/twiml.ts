export const config = { runtime: "edge" };

function corsHeaders(req: Request, methods: string[]) {
  const reqHeaders = req.headers.get("access-control-request-headers") || "Content-Type, Authorization, X-Requested-With, x-health-check";
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods.join(", "),
    "Access-Control-Allow-Headers": reqHeaders,
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

export default async function handler(req: Request): Promise<Response> {
  const cors = corsHeaders(req, ["GET", "OPTIONS"]);
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID || "agent_8801k1zkfgxbe6k86btzyhxmzga2";
    const xml = `
      <Response>
        <Connect>
          <Stream url="wss://api.elevenlabs.io/v1/stream/agent/${agentId}"/>
        </Connect>
      </Response>
    `.trim();

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml", ...cors },
    });
  } catch (err: any) {
    console.error("twiml error:", err);
    return new Response(`<Response><Say>Server error.</Say></Response>`, {
      status: 500,
      headers: { "Content-Type": "text/xml", ...cors },
    });
  }
}
