import { NextResponse } from "next/server";

const fallback = (body: any) => {
  const locale = body.locale === "es" ? "es" : "en";
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
  const candidates =
    locale === "es"
      ? [
          [
            "Automatizar pedidos entrantes",
            "Extrae pedidos entrantes, valídalos con el conocimiento de la empresa y envía registros limpios al sistema destino.",
            8,
            [systems[0], "Conocimiento de la empresa", systems.at(-1)],
          ],
          [
            "Calificar leads entrantes",
            "Investiga y puntúa los nuevos leads antes de enviar las oportunidades cualificadas al responsable correcto.",
            5,
            [systems[0], systems.find((s) => s === "Salesforce") || systems.at(-1)],
          ],
          [
            "Resolver solicitudes de soporte",
            "Clasifica las solicitudes, encuentra una respuesta aprobada y pausa para revisión cuando la confianza es baja.",
            4,
            [systems.find((s) => s === "Slack") || systems[0], "Conocimiento de la empresa"],
          ],
          [
            "Conciliar facturas de proveedores",
            "Compara las líneas de factura con los registros fuente y muestra solo las excepciones para revisión.",
            3,
            [
              systems.find((s) => s.includes("Microsoft")) || systems[0],
              systems.at(-1),
            ],
          ],
          [
            "Redactar informe semanal de operaciones",
            "Recopila métricas recurrentes y prepara un resumen semanal conciso de operaciones.",
            2,
            systems.slice(0, 3),
          ],
          [
            "Enriquecer registros de clientes",
            "Reúne el contexto del cliente y actualiza automáticamente los registros incompletos.",
            2,
            systems.slice(0, 2),
          ],
        ]
      : [
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
    evidence:
      evidence ||
      (locale === "es"
        ? `Patrones encontrados en ${systems.join(", ")}`
        : `Patterns found across ${systems.join(", ")}`),
    hours: c[2],
    impact: i < 3 ? "High" : "Medium",
    effort: i < 2 ? "Low" : "Medium",
    confidence: 94 - i * 3,
    systems: c[3],
  }));
};

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ opportunities: fallback(body), mode: "demo" });
}
