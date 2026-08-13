import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { generateOpportunities } from "@/lib/opportunities";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await generateOpportunities(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate opportunities." }, { status: 502 }); }
}
