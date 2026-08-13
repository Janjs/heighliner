import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { composio } from "@/lib/composio";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nonce = url.searchParams.get("nonce");
  const accountId = url.searchParams.get("connected_account_id");
  const cookieStore = await cookies();
  if (!nonce || nonce !== cookieStore.get("heighliner_google_nonce")?.value || !accountId || url.searchParams.get("status") !== "success") return NextResponse.redirect(new URL("/signin?error=google", request.url));

  try {
    const accounts = await composio.connectedAccounts.list({ userIds: [`heighliner-auth-${nonce}`], toolkitSlugs: ["gmail"] });
    if (!accounts.items.some((account) => account.id === accountId && account.status === "ACTIVE")) throw new Error("Invalid Google connection.");
    const entityId = `heighliner-auth-${nonce}`;
    const result = await composio.tools.execute("GMAIL_FETCH_EMAILS", { connectedAccountId: accountId, userId: entityId, dangerouslySkipVersionCheck: true, arguments: { query: "in:sent", max_results: 1, verbose: false, include_payload: false } });
    const data = result.data as { messages?: { sender?: string | null }[] } | undefined;
    const email = String(data?.messages?.[0]?.sender ?? "").match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase() ?? "";
    if (!email) throw new Error("Google did not return an email address.");

    db.prepare("INSERT INTO users (email, password_hash, gmail_account_id, gmail_entity_id, gmail_enabled) VALUES (?, 'google-oauth', ?, ?, 0) ON CONFLICT(email) DO UPDATE SET gmail_account_id = excluded.gmail_account_id, gmail_entity_id = excluded.gmail_entity_id, gmail_enabled = 0").run(email, accountId, entityId);
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number };
    await createSession(user.id);
    cookieStore.delete("heighliner_google_nonce");
    return NextResponse.redirect(new URL("/app", request.url));
  } catch {
    return NextResponse.redirect(new URL("/signin?error=google", request.url));
  }
}
