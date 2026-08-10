import { NextResponse } from "next/server";

const INQUIRY_TO = process.env.INQUIRY_TO_EMAIL ?? "jan.jime.serra@gmail.com";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const body = await request.json();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim();
  const size = String(body.size ?? "").trim();
  const description = String(body.description ?? "").trim();
  const bottlenecks = String(body.bottlenecks ?? "").trim();

  if (!company || !email || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const text = [
    `Company: ${company}`,
    `Contact: ${email}`,
    `Team size: ${size || "Not provided"}`,
    `What they do: ${description}`,
    bottlenecks
      ? `Where work gets stuck: ${bottlenecks}`
      : "Where work gets stuck: Not provided",
  ].join("\n");

  const from = process.env.RESEND_FROM ?? "Heighliner <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [INQUIRY_TO],
      reply_to: email,
      subject: `Heighliner inquiry — ${company}`,
      text,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
