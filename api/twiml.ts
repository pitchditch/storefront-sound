export async function GET() {
  const xml = `
    <Response>
      <Connect>
        <Stream url="wss://api.elevenlabs.io/v1/stream/agent/agent_8801k1zkfgxbe6k86btzyhxmzga2"/>
      </Connect>
    </Response>
  `;

  return new Response(xml, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
