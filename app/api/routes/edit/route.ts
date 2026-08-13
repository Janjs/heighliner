import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { editRoute } from "@/lib/routes";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = Number(body.route?.id);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!Number.isInteger(id) || !message || message.length > 1_000)
    return NextResponse.json({ error: "Invalid route edit." }, { status: 400 });

  try {
    const route = await editRoute(user.id, id, message);
    return NextResponse.json({
      reply: "Route updated.",
      route: { id: String(id), ...route, createdAt: id },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to edit the route.",
      },
      { status: 502 },
    );
  }
}
