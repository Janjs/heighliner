import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.COMPOSIO_API_KEY;
  if (!key)
    return NextResponse.json(
      { error: "Composio is not configured." },
      { status: 502 },
    );

  try {
    const response = await fetch(
      "https://backend.composio.dev/api/v3.1/toolkits?limit=1000&sort_by=usage",
      { headers: { "x-api-key": key } },
    );
    if (!response.ok) throw new Error("Unable to load systems.");
    const page = (await response.json()) as {
      items: {
        name: string;
        slug: string;
        meta?: { logo?: string; description?: string };
      }[];
    };
    return NextResponse.json({
      toolkits: page.items.map((item) => ({
        name: item.name,
        slug: item.slug,
        logo: item.meta?.logo,
        description: item.meta?.description,
      })),
    });
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
