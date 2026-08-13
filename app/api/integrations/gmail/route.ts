import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchPromotions } from "@/lib/gmail";
import { composio, composioUserId, requireGmailConfig } from "@/lib/composio";

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    connected: Boolean(user.gmailEnabled && user.gmailAccountId),
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (!user.gmailAccountId || !user.gmailEntityId) {
      const entityId = composioUserId(user.id);
      const connection = await composio.connectedAccounts.link(
        entityId,
        requireGmailConfig(),
        {
          callbackUrl: `${new URL(request.url).origin}/api/integrations/gmail/callback`,
        },
      );
      if (!connection.redirectUrl)
        throw new Error("Gmail did not return a connection link.");
      return NextResponse.json({
        connected: false,
        redirectUrl: connection.redirectUrl,
      });
    }
    const promotions = await fetchPromotions(
      user.gmailAccountId,
      user.gmailEntityId,
    );
    const summary = promotions.length
      ? promotions.map((mail) => `${mail.subject} — ${mail.sender}`).join("\n")
      : "No promotional messages found in the last 30 days.";
    const save = db.transaction(() => {
      db.prepare(
        "DELETE FROM sources WHERE user_id = ? AND kind = 'gmail'",
      ).run(user.id);
      db.prepare(
        "INSERT INTO sources (user_id, name, kind, parsed_text) VALUES (?, 'Gmail promotions', 'gmail', ?)",
      ).run(user.id, summary);
      db.prepare("UPDATE users SET gmail_enabled = 1 WHERE id = ?").run(
        user.id,
      );
    });
    save();
    return NextResponse.json({
      connected: true,
      promotions: promotions.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to connect Gmail.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.gmailAccountId)
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 404 },
    );

  try {
    try {
      const deleted = await composio.connectedAccounts.delete(
        user.gmailAccountId,
      );
      if (!deleted.success)
        throw new Error("Composio did not delete the Gmail connection.");
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (
        status !== 404 &&
        !(error instanceof Error && error.message.startsWith("404 "))
      )
        throw error;
    }

    db.transaction(() => {
      db.prepare(
        "DELETE FROM sources WHERE kind = 'gmail' AND user_id IN (SELECT id FROM users WHERE gmail_account_id = ?)",
      ).run(user.gmailAccountId);
      db.prepare(
        "UPDATE users SET gmail_account_id = NULL, gmail_entity_id = NULL, gmail_enabled = 0 WHERE gmail_account_id = ?",
      ).run(user.gmailAccountId);
    })();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to disconnect Gmail.",
      },
      { status: 502 },
    );
  }
}
