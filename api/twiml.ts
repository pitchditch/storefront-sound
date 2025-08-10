// Edge runtime
export const config = { runtime: "edge" };

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(_req: Request): Promise<Response> {
  const headers = { "Content-Type": "text/xml" };

  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return new Response(
        `<Response><Say>Server missing AI credentials.</Say></Response>`,
        { status: 500, headers }
      );
    }

    let signedUrl: string | null = null;
    try {
      const r = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(
          agentId
        )}`,
        { headers: { "xi-api-key": apiKey } }
      );
      if (r.ok) {
        const j = (await r.json()) as { signed_url?: string };
        signedUrl = j?.signed_url || null;
      } else {
        console.error("get_signed_url failed:", r.status, await r.text().catch(() => ""));
      }
    } catch (e) {
      console.error("get_signed_url error:", e);
    }

    const xml = signedUrl
      ? `<Response><Connect><Stream url="wss://api.elevenlabs.io/v1/convai/stream"><Parameter name="agent_id" value="${xmlEscape(
          agentId
        )}"/><Parameter name="signed_url" value="${xmlEscape(signedUrl)}"/></Stream></Connect></Response>`
      : `<Response><Connect><Stream url="wss://api.elevenlabs.io/v1/stream/agent/${xmlEscape(
          agentId
        )}"/></Connect></Response>`;

    return new Response(xml, { status: 200, headers });
  } catch (e) {
    return new Response(
      `<Response><Say>Application error. Goodbye.</Say></Response>`,
      { status: 500, headers }
    );
  }
}
