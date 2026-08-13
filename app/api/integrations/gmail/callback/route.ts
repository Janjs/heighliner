import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { composioUserId } from "@/lib/composio";

export async function GET(request: Request) {
  const user = await currentUser();
  const url = new URL(request.url);
  const accountId = url.searchParams.get("connected_account_id");
  if (!user || !accountId || url.searchParams.get("status") !== "success") return NextResponse.redirect(new URL("/app?source=error", request.url));
  db.prepare("UPDATE users SET gmail_account_id = ?, gmail_entity_id = ?, gmail_enabled = 0 WHERE id = ?").run(accountId, composioUserId(user.id), user.id);
  return NextResponse.redirect(new URL("/app?source=gmail", request.url));
}
