import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { toPhoneNumber } = await req.json();

  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
  const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER!;

  const twilioURL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

  const twimlWebhookUrl = "https://your-vercel-app.vercel.app/api/twiml"; // update this after deploy

  const form = new URLSearchParams({
    To: toPhoneNumber,
    From: TWILIO_FROM_NUMBER,
    Url: twimlWebhookUrl,
  });

  const response = await fetch(twilioURL, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const result = await response.json();
  return NextResponse.json(result);
}
