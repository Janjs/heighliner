import { Composio } from "@composio/core";
import { NextResponse } from "next/server";

const envKey = (name: string) =>
  `COMPOSIO_AUTH_CONFIG_${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;

export async function POST(request: Request) {
  const { integration } = await request.json();
  const apiKey = process.env.COMPOSIO_API_KEY;
  const authConfigId = process.env[envKey(integration)];

  if (!apiKey || !authConfigId) {
    return NextResponse.json({ configured: false }, { status: 501 });
  }

  try {
    const composio = new Composio({ apiKey });
    const connection = await composio.connectedAccounts.link(
      process.env.COMPOSIO_USER_ID || "heighliner-demo",
      authConfigId,
      { callbackUrl: new URL("/", request.url).toString() },
    );
    return NextResponse.json({
      configured: true,
      redirectUrl: connection.redirectUrl,
      connectionId: connection.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to start connection",
      },
      { status: 502 },
    );
  }
}
