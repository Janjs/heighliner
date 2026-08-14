import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseFile } from "@/lib/ai";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !file.size)
    return NextResponse.json(
      { error: "Choose a file to upload." },
      { status: 400 },
    );
  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json(
      { error: "Files must be 20 MB or smaller." },
      { status: 413 },
    );
  try {
    const parsed = await parseFile(file);
    db.prepare(
      "INSERT INTO sources (user_id, name, kind, parsed_text) VALUES (?, ?, ?, ?)",
    ).run(user.id, file.name, file.type || "file", parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to parse file.",
      },
      { status: 502 },
    );
  }
}
