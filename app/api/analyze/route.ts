import { NextResponse } from "next/server";

const fallback = (body: any) => {
  const systems: string[] = body.integrations?.length
    ? body.integrations
    : ["Gmail", "Google Drive"];
  const evidence = [
    body.company?.processes,
    body.company?.bottlenecks,
    ...(body.files || []).map((f: any) => f.name),
  ]
    .filter(Boolean)
    .join(" · ");
  const candidates = [
    [
      "Automate incoming orders",
      "Extract incoming orders, validate them against company knowledge, and send clean records to the destination system.",
      8,
      [systems[0], "Company knowledge", systems.at(-1)],
    ],
    [
      "Qualify inbound leads",
      "Research and score new leads before routing qualified opportunities to the right owner.",
      5,
      [systems[0], systems.find((s) => s === "Salesforce") || systems.at(-1)],
    ],
    [
      "Resolve support requests",
      "Classify requests, find an approved answer, and pause for review when confidence is low.",
      4,
      [systems.find((s) => s === "Slack") || systems[0], "Company knowledge"],
    ],
    [
      "Reconcile supplier invoices",
      "Compare invoice line items with source records and surface only exceptions for review.",
      3,
      [
        systems.find((s) => s.includes("Microsoft")) || systems[0],
        systems.at(-1),
      ],
    ],
    [
      "Draft weekly operations report",
      "Collect recurring metrics and prepare a concise weekly operations summary.",
      2,
      systems.slice(0, 3),
    ],
    [
      "Enrich customer records",
      "Bring customer context together and update incomplete account records automatically.",
      2,
      systems.slice(0, 2),
    ],
  ];
  return candidates.map((c, i) => ({
    id: `opp-${i + 1}`,
    title: c[0],
    description: c[1],
    evidence: evidence || `Patterns found across ${systems.join(", ")}`,
    hours: c[2],
    impact: i < 3 ? "High" : "Medium",
    effort: i < 2 ? "Low" : "Medium",
    confidence: 94 - i * 3,
    systems: c[3],
  }));
};

export async function POST(request: Request) {
  const body = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json({ opportunities: fallback(body), mode: "local" });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: `Analyze this company context and return exactly six specific AI automation opportunities as JSON. Company: ${JSON.stringify(body.company)}. Uploaded file names: ${JSON.stringify(body.files)}. Connected systems: ${JSON.stringify(body.integrations)}. Return an object with an opportunities array. Each item: id, title, description, evidence, hours (number), impact (High or Medium), effort (Low or Medium), confidence (number), systems (array).`,
        text: { format: { type: "json_object" } },
      }),
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    const text = data.output
      ?.flatMap((o: any) => o.content || [])
      .find((c: any) => c.type === "output_text")?.text;
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ opportunities: fallback(body), mode: "local" });
  }
}
