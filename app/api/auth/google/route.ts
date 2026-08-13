import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { composio, requireGmailConfig } from "@/lib/composio";

export async function GET(request: Request) {
  try {
    const nonce = randomBytes(24).toString("base64url");
    const origin = new URL(request.url).origin;
    const connection = await composio.connectedAccounts.link(`heighliner-auth-${nonce}`, requireGmailConfig(), {
      callbackUrl: `${origin}/api/auth/google/callback?nonce=${nonce}`,
    });
    if (!connection.redirectUrl) throw new Error("Google did not return a sign-in link.");
    const response = NextResponse.redirect(connection.redirectUrl);
    response.cookies.set("heighliner_google_nonce", nonce, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/signin?error=google", request.url));
  }
}
