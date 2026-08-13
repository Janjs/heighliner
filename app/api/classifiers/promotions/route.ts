import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { fetchPromotions } from "@/lib/gmail";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.gmailAccountId || !user.gmailEntityId) return NextResponse.json({ error: "Connect Gmail first." }, { status: 409 });

  try {
    const messages = await fetchPromotions(user.gmailAccountId, user.gmailEntityId);
    return NextResponse.json({ count: messages.length, messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to classify Gmail." }, { status: 502 });
  }
}
