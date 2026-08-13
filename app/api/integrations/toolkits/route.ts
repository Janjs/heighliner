import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listComposioToolkits } from "@/lib/composio";

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ toolkits: await listComposioToolkits() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load systems.",
      },
      { status: 502 },
    );
  }
}
