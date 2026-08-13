"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BotIcon,
  BoxesIcon,
  Camera01Icon,
  Cancel01Icon,
  CheckIcon,
  CheckmarkCircle02Icon,
  ChevronRightIcon,
  CircleIcon,
  Database01Icon,
  Delete02Icon,
  File01Icon,
  Folder01Icon,
  GitBranchIcon,
  Mail01Icon,
  MoreVerticalIcon,
  PlayIcon,
  Route01Icon,
  Search01Icon,
  SparklesIcon,
  Upload01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { LoadingOrb } from "../components/loading-orb";

type View = "Routes" | "Opportunities" | "Sources";
type Lang = "en" | "es" | "nl";

const languageLabels: Record<Lang, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};

const accountCtaByLang: Record<Lang, { prompt: string; action: string }> = {
  en: {
    prompt: "Would you like us to do this for your company?",
    action: "Reach out",
  },
  es: {
    prompt: "¿Quieres que hagamos esto para tu empresa?",
    action: "Hablemos",
  },
  nl: {
    prompt: "Wil je dat we dit voor jouw bedrijf doen?",
    action: "Neem contact op",
  },
};

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .297a12 12 0 0 0-3.79 23.408c.6.11.82-.26.82-.577v-2.17c-3.34.726-4.04-1.416-4.04-1.416-.546-1.385-1.33-1.755-1.33-1.755-1.09-.746.082-.73.082-.73 1.2.085 1.83 1.233 1.83 1.233 1.07 1.83 2.81 1.3 3.49.99.11-.775.42-1.3.76-1.6-2.66-.303-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.303-.54-1.52.12-3.16 0 0 1.01-.324 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.56 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.11.81 2.23v3.31c0 .32.22.7.83.58A12 12 0 0 0 12 .297Z" />
    </svg>
  );
}

function resolveLang(value: string | null, browserLang: string): Lang {
  if (value === "en" || value === "es" || value === "nl") return value;
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("nl")) return "nl";
  return "en";
}

const executionCopyByLang = {
  en: {
    title: "Run detail",
    summary: "Result",
    created: "Order #1842 created in Salesforce",
    steps: "Completed steps",
    review: "BCN-GAUDI-03 confirmed during human review",
  },
  es: {
    title: "Detalle de la ejecución",
    summary: "Resultado",
    created: "Pedido #1842 creado en Salesforce",
    steps: "Pasos completados",
    review: "BCN-GAUDI-03 confirmado durante la revisión humana",
  },
  nl: {
    title: "Run-detail",
    summary: "Resultaat",
    created: "Order #1842 aangemaakt in Salesforce",
    steps: "Voltooide stappen",
    review: "BCN-GAUDI-03 bevestigd tijdens menselijke review",
  },
} satisfies Record<Lang, Record<string, string>>;

const chatCopyByLang = {
  en: {
    tab: "Edit route",
    historyTab: "Runs",
    title: "Edit this route",
    intro:
      "Describe the change you want. I can add, remove, reorder, or rename steps.",
    placeholder: "E.g. Add approval before Salesforce",
    error: "I couldn’t apply that change. Please try again.",
  },
  es: {
    tab: "Editar ruta",
    historyTab: "Ejecuciones",
    title: "Editar esta ruta",
    intro:
      "Describe el cambio que quieres hacer. Puedo añadir, quitar, reordenar o renombrar pasos.",
    placeholder: "Ej.: Añade una aprobación antes de Salesforce",
    error: "No pude aplicar ese cambio. Inténtalo de nuevo.",
  },
  nl: {
    tab: "Route bewerken",
    historyTab: "Runs",
    title: "Deze route bewerken",
    intro:
      "Beschrijf de wijziging die je wilt. Ik kan stappen toevoegen, verwijderen, herschikken of hernoemen.",
    placeholder: "Bijv. Voeg goedkeuring toe vóór Salesforce",
    error: "Die wijziging kon ik niet toepassen. Probeer het opnieuw.",
  },
} satisfies Record<
  Lang,
  {
    tab: string;
    historyTab: string;
    title: string;
    intro: string;
    placeholder: string;
    error: string;
  }
>;

const routePanelLabel: Record<Lang, string> = {
  en: "Route panel",
  es: "Panel de ruta",
  nl: "Routepaneel",
};
type Company = {
  name: string;
  description: string;
  size: string;
  departments: string;
  processes: string;
  bottlenecks: string;
};
type LeadForm = {
  name: string;
  description: string;
  size: string;
  bottlenecks: string;
};
type SourceFile = { name: string; size: number; type: string };
type Opportunity = {
  id: string;
  title: string;
  description: string;
  evidence: string;
  hours: number;
  impact: "High" | "Medium";
  effort: "Low" | "Medium";
  confidence: number;
  systems: string[];
  status?: "open" | "converted";
};
type RouteData = {
  id: string;
  opportunityId?: string;
  title: string;
  description: string;
  hours: number;
  systems: string[];
  createdAt: number;
  steps?: RouteStep[];
  executions?: RouteExecution[];
};
type RouteStep = Pick<FlowData, "label" | "detail" | "kind"> & {
  action?: "read_sources" | "read_files" | "ai_transform" | "create_file";
};
type RouteExecution = {
  id: string;
  status: "running" | "completed" | "failed";
  output: string;
  outputName?: string | null;
  outputType?: string | null;
  durationMs: number;
  createdAt: string;
  completedSteps?: string[];
  reviewed?: boolean;
};
const executionTime = (createdAt: string) =>
  new Date(
    createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`,
  ).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const executionDuration = (durationMs: number) =>
  durationMs < 1_000
    ? `${durationMs}ms`
    : durationMs < 60_000
      ? `${(durationMs / 1_000).toFixed(1)}s`
      : `${Math.floor(durationMs / 60_000)}m ${Math.round((durationMs % 60_000) / 1_000)}s`;
const recentRuns = (route: RouteData) =>
  (route.executions || []).filter(
    (execution) =>
      Date.now() -
        new Date(
          execution.createdAt.includes("T")
            ? execution.createdAt
            : `${execution.createdAt.replace(" ", "T")}Z`,
        ).getTime() <
      7 * 24 * 60 * 60 * 1_000,
  ).length;
const successRate = (route: RouteData) => {
  const executions = (route.executions || []).filter(
    (run) => run.status !== "running",
  );
  if (!executions.length) return "—";
  return `${Math.round((executions.filter((run) => run.status === "completed").length / executions.length) * 100)}%`;
};
function RunResult({ output }: { output: string }) {
  const [raw, setRaw] = useState(false);
  let parsed: unknown;
  try {
    parsed = JSON.parse(output.replace(/^```json\s*|\s*```$/g, ""));
  } catch {
    return (
      <div className="mt-2 whitespace-pre-wrap rounded-[16px] bg-[#edf6ef] p-4 text-[11px] leading-5 text-[#396c47]">
        {output}
      </div>
    );
  }

  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const tabular = rows.every(
    (row) => row && typeof row === "object" && !Array.isArray(row),
  );
  const columns = tabular
    ? [...new Set(rows.flatMap((row) => Object.keys(row as object)))]
    : [];
  const value = (item: unknown) =>
    item && typeof item === "object"
      ? JSON.stringify(item)
      : String(item ?? "—");

  return (
    <div className="mt-2">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setRaw((current) => !current)}
          className="pressable rounded-full bg-black/[.055] px-3 py-1.5 text-[9px] font-semibold text-[#686863] hover:bg-black/[.08]"
        >
          {raw ? "View formatted" : "View raw JSON"}
        </button>
      </div>
      {raw ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-[16px] bg-[#20201f] p-4 text-[10px] leading-5 text-white">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      ) : tabular ? (
        <div className="overflow-x-auto rounded-[16px] border border-[#dce9df] bg-[#edf6ef]">
          <table className="w-full border-collapse text-left text-[10px] text-[#396c47]">
            <thead>
              <tr className="border-b border-[#d2e2d6]">
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2.5 font-semibold">
                    {column.replaceAll("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-[#dce9df] last:border-0"
                >
                  {columns.map((column) => (
                    <td key={column} className="px-3 py-2.5 align-top">
                      {value((row as Record<string, unknown>)[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="whitespace-pre-wrap rounded-[16px] bg-[#edf6ef] p-4 text-[11px] leading-5 text-[#396c47]">
          {value(parsed)}
        </div>
      )}
    </div>
  );
}

function MarkdownFileViewer({
  output,
  name,
  href,
}: {
  output: string;
  name: string;
  href?: string;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-[16px] border border-black/[.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,.035)]">
      <div className="flex items-center gap-3 border-b border-black/[.06] px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#edf6ef] text-[#396c47]">
          <HugeiconsIcon icon={File01Icon} size={15} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
          {name}
        </span>
        <a
          href={
            href ?? `data:text/markdown;charset=utf-8,${encodeURIComponent(output)}`
          }
          download={name}
          className="pressable rounded-full bg-black/[.055] px-3 py-1.5 text-[9px] font-semibold text-[#62625e] hover:bg-black/[.08]"
        >
          Download
        </a>
      </div>
      <div className="max-h-[520px] overflow-auto bg-[#f7f7f4] p-3">
        <article className="min-h-64 rounded-[12px] bg-white px-5 py-6 text-[11px] leading-5 text-[#444440] shadow-sm [&_a]:text-[#cb501d] [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[#ffb38e] [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-black/[.055] [&_code]:px-1 [&_h1]:mb-4 [&_h1]:text-[20px] [&_h1]:font-semibold [&_h1]:tracking-[-.035em] [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[12px] [&_h3]:font-semibold [&_hr]:my-5 [&_hr]:border-black/[.08] [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2.5 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:bg-[#20201f] [&_pre]:p-3 [&_pre]:text-white [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black/[.08] [&_td]:p-2 [&_th]:border [&_th]:border-black/[.08] [&_th]:bg-black/[.035] [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
type FlowData = {
  label: string;
  detail: string;
  kind: "system" | "ai" | "knowledge" | "logic" | "human";
  action?: RouteStep["action"];
  integration?: string;
  status?: "idle" | "running" | "done";
};

const spring = { type: "spring" as const, bounce: 0, duration: 0.38 };
const panelTransition = {
  type: "tween" as const,
  duration: 0.12,
  ease: [0.25, 0.1, 0.25, 1] as const,
};
const companyIntegrations = [
  "Salesforce",
  "Slack",
  "Microsoft 365",
  "WhatsApp",
  "Gmail",
  "Google Drive",
  "Notion",
];
const personalIntegrations = [
  "WhatsApp",
  "Gmail",
  "Google Drive",
  "YouTube",
  "Notion",
  "LinkedIn",
];
const suggestedIntegrations = (profileType: "company" | "personal") =>
  profileType === "personal" ? personalIntegrations : companyIntegrations;

const integrationLogos: Record<string, string> = {
  Gmail: "/integrations/gmail.svg",
  "Google Drive": "/integrations/google-drive.svg",
  Slack: "/integrations/slack.svg",
  "Microsoft 365": "/integrations/microsoft-365.svg",
  Salesforce: "/integrations/salesforce.svg",
  Notion: "/integrations/notion.svg",
  WhatsApp: "/integrations/whatsapp.svg",
  YouTube: "/integrations/youtube.svg",
  LinkedIn: "/integrations/linkedin.svg",
};
const repoUrl = "https://github.com/Janjs/heighliner";
const leadDefaults: LeadForm = {
  name: "",
  description: "",
  size: "11–50",
  bottlenecks: "",
};
const companyDefaults: Company = {
  name: "",
  description: "",
  size: "11–50",
  departments: "",
  processes: "",
  bottlenecks: "",
};
const exampleCompany: Company = {
  name: "Amazonik",
  description:
    "Creates and wholesales Barcelona and Costa Brava souvenirs to retail shops, with no direct-to-consumer sales.",
  size: "51–200",
  departments: "Wholesale sales, design, operations, logistics",
  processes: "Retailer order entry, product matching, stock checks, fulfilment",
  bottlenecks:
    "Retailers send orders over WhatsApp and email in different formats, and products are matched manually",
};
const exampleFiles: SourceFile[] = [
  { name: "Order processing SOP.pdf", size: 184_320, type: "application/pdf" },
  {
    name: "Product catalogue.xlsx",
    size: 438_272,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  { name: "Retailer accounts.csv", size: 92_160, type: "text/csv" },
];
const exampleIntegrations = ["WhatsApp", "Gmail", "Google Drive", "Salesforce"];
const exampleOpportunities: Opportunity[] = [
  {
    id: "opp-orders",
    status: "converted",
    title: "Automate incoming orders",
    description:
      "Extract retailer orders from WhatsApp voice notes, photos, and email PDFs, match products against the catalogue, and create clean records in Salesforce.",
    evidence:
      "Order processing SOP.pdf · Retailers send orders over WhatsApp and email in different formats",
    hours: 8,
    impact: "High",
    effort: "Low",
    confidence: 94,
    systems: ["WhatsApp", "Gmail", "Company knowledge", "Salesforce"],
  },
  {
    id: "opp-catalogue",
    status: "converted",
    title: "Match products to catalogue",
    description:
      "Map free-text product descriptions from retailer orders to SKU entries in the product catalogue spreadsheet.",
    evidence:
      "Product catalogue.xlsx · Retailers use inconsistent naming for the same souvenir lines",
    hours: 5,
    impact: "High",
    effort: "Low",
    confidence: 91,
    systems: ["Google Drive", "Company knowledge"],
  },
  {
    id: "opp-accounts",
    title: "Validate retailer accounts",
    description:
      "Cross-check incoming WhatsApp and email orders against active retailer accounts and flag orders from unknown or inactive shops.",
    evidence:
      "Retailer accounts.csv · New shops occasionally order on WhatsApp before onboarding is complete",
    hours: 4,
    impact: "High",
    effort: "Medium",
    confidence: 88,
    systems: ["WhatsApp", "Gmail", "Salesforce"],
  },
  {
    id: "opp-packing",
    status: "converted",
    title: "Generate packing lists",
    description:
      "Consolidate confirmed orders into warehouse packing lists grouped by delivery route and pallet size.",
    evidence:
      "Order processing SOP.pdf · Operations team builds packing lists by hand each afternoon",
    hours: 3,
    impact: "Medium",
    effort: "Medium",
    confidence: 85,
    systems: ["Salesforce", "Company knowledge"],
  },
  {
    id: "opp-shipments",
    title: "Notify retailers on dispatch",
    description:
      "Send personalised dispatch confirmations with tracking details when fulfilment marks an order as shipped.",
    evidence:
      "Gmail · Wholesale sales manually emails each retailer after dispatch",
    hours: 2,
    impact: "Medium",
    effort: "Low",
    confidence: 82,
    systems: ["Gmail", "Salesforce"],
  },
  {
    id: "opp-enrich",
    title: "Enrich retailer profiles",
    description:
      "Fill in missing contact details and shop type on retailer accounts using order history and email signatures.",
    evidence:
      "Retailer accounts.csv · Many accounts lack a buyer name or shop category",
    hours: 2,
    impact: "Medium",
    effort: "Low",
    confidence: 79,
    systems: ["Gmail", "Salesforce"],
  },
];
const exampleRouteSteps: Record<string, RouteStep[]> = {
  "opp-catalogue": [
    {
      label: "Google Drive",
      detail: "Load latest product catalogue spreadsheet",
      kind: "system",
    },
    {
      label: "Order line item",
      detail: "Receive unmatched product description from order pipeline",
      kind: "system",
    },
    {
      label: "Semantic match",
      detail: "Find closest catalogue entry by name, material, and size",
      kind: "ai",
    },
    {
      label: "Past matches",
      detail: "Check previous manual mappings for this retailer",
      kind: "knowledge",
    },
    {
      label: "Confidence threshold",
      detail: "Accept match above 90%, otherwise route for review",
      kind: "logic",
    },
    {
      label: "Confirm SKU",
      detail: "Choose between two close catalogue matches",
      kind: "human",
    },
    {
      label: "Update catalogue alias",
      detail: "Save confirmed mapping as a retailer-specific alias",
      kind: "system",
    },
  ],
  "opp-accounts": [
    {
      label: "WhatsApp",
      detail: "Detect shop name from the incoming order chat",
      kind: "system",
    },
    {
      label: "Retailer accounts",
      detail: "Look up sender against active account list",
      kind: "knowledge",
    },
    {
      label: "Account status",
      detail:
        "Check credit terms, delivery zone, and active flag in Salesforce",
      kind: "system",
    },
    {
      label: "Unknown retailer",
      detail: "Flag orders from unregistered or inactive accounts",
      kind: "logic",
    },
    {
      label: "Wholesale manager",
      detail: "Approve new retailer or reactivate dormant account",
      kind: "human",
    },
    {
      label: "Update Salesforce",
      detail: "Link order to validated retailer account",
      kind: "system",
    },
  ],
  "opp-packing": [
    {
      label: "Salesforce",
      detail: "Fetch confirmed orders due for dispatch today",
      kind: "system",
    },
    {
      label: "Group by route",
      detail: "Cluster orders by delivery region and pallet capacity",
      kind: "ai",
    },
    {
      label: "Warehouse layout",
      detail: "Sort lines by pick aisle to minimise walk time",
      kind: "knowledge",
    },
    {
      label: "Output file",
      detail: "Save the packing list as a Markdown file",
      kind: "system",
      action: "create_file",
    },
  ],
  "opp-shipments": [
    {
      label: "Salesforce",
      detail: "Order marked as shipped with tracking number",
      kind: "system",
    },
    {
      label: "Retailer context",
      detail: "Load buyer name, language, and preferred greeting",
      kind: "knowledge",
    },
    {
      label: "Draft confirmation",
      detail: "Compose dispatch email with line summary and tracking link",
      kind: "ai",
    },
    {
      label: "Gmail",
      detail: "Send confirmation from wholesale sales inbox",
      kind: "system",
    },
  ],
  "opp-enrich": [
    {
      label: "Salesforce",
      detail: "Find retailer accounts missing buyer name or shop type",
      kind: "system",
    },
    {
      label: "Gmail history",
      detail: "Scan recent order emails for signatures and contact details",
      kind: "system",
    },
    {
      label: "Extract profile",
      detail: "Pull buyer name, phone, and shop category from email content",
      kind: "ai",
    },
    {
      label: "Duplicate check",
      detail: "Skip if another account already uses the same email",
      kind: "logic",
    },
    {
      label: "Update account",
      detail: "Write enriched fields back to Salesforce retailer record",
      kind: "system",
    },
  ],
};
const packingListOutput = `# Packing list · 13 Aug 2026

Dispatch for Amazonik warehouse, Zona Franca.

## Route 1 · Eixample
Pallet 1 of 1 · 48 units

| SKU | Product | Qty |
| --- | --- | --- |
| BCN-GAUDI-03 | Trencadís magnet, 8 cm | 24 |
| BCN-GAUDI-07 | Sagrada Família mosaic tile | 12 |
| CB-BOAT-02 | Costa Brava sardana figure | 12 |

Pick aisle B, then C.

## Route 2 · Barceloneta
Pallet 1 of 1 · 36 units

| SKU | Product | Qty |
| --- | --- | --- |
| BCN-GAUDI-03 | Trencadís magnet, 8 cm | 18 |
| CB-WAVE-01 | Medas Islands paperweight | 18 |

Pick aisle B, then A.
`;
const exampleRoutes: RouteData[] = [
  {
    id: "example-route-orders",
    opportunityId: "opp-orders",
    title: "Automate incoming orders",
    description:
      "Extract retailer orders from WhatsApp voice notes, photos, and email PDFs, match products against the catalogue, and create clean records in Salesforce.",
    hours: 8,
    systems: ["WhatsApp", "Gmail", "Company knowledge", "Salesforce"],
    createdAt: 1,
    executions: [
      {
        id: "example-run-orders-1",
        status: "completed",
        output: JSON.stringify({
          order: "1842",
          retailer: "Souvenirs Passeig",
          sku: "BCN-GAUDI-03",
          qty: 24,
        }),
        durationMs: 94_000,
        createdAt: "2026-08-13 09:42:00",
        completedSteps: ["WhatsApp", "Gmail", "Human review", "Salesforce"],
      },
      {
        id: "example-run-orders-2",
        status: "completed",
        output: JSON.stringify({
          order: "1839",
          retailer: "Casa del Recuerdo",
          sku: "BCN-GAUDI-07",
          qty: 12,
        }),
        durationMs: 126_000,
        createdAt: "2026-08-12 16:18:00",
        completedSteps: ["WhatsApp", "Gmail", "Human review", "Salesforce"],
        reviewed: true,
      },
      {
        id: "example-run-orders-3",
        status: "completed",
        output: JSON.stringify({
          order: "1836",
          retailer: "Botiga Gaudí",
          sku: "CB-BOAT-02",
          qty: 18,
        }),
        durationMs: 101_000,
        createdAt: "2026-08-12 11:03:00",
        completedSteps: ["WhatsApp", "Gmail", "Salesforce"],
      },
      {
        id: "example-run-orders-4",
        status: "completed",
        output: JSON.stringify({
          order: "1828",
          retailer: "Souvenirs Passeig",
          sku: "CB-WAVE-01",
          qty: 36,
        }),
        durationMs: 112_000,
        createdAt: "2026-08-08 17:25:00",
        completedSteps: ["WhatsApp", "Gmail", "Salesforce"],
      },
    ],
  },
  {
    id: "example-route-catalogue",
    opportunityId: "opp-catalogue",
    title: "Match products to catalogue",
    description:
      "Map free-text product descriptions from retailer orders to SKU entries in the product catalogue spreadsheet.",
    hours: 5,
    systems: ["Google Drive", "Company knowledge"],
    createdAt: 2,
    steps: exampleRouteSteps["opp-catalogue"],
    executions: [
      {
        id: "example-run-catalogue-1",
        status: "completed",
        output: JSON.stringify({
          input: "gaudi magnet mosaic 8cm",
          sku: "BCN-GAUDI-03",
          confidence: "96%",
        }),
        durationMs: 48_000,
        createdAt: "2026-08-13 08:14:00",
        completedSteps: exampleRouteSteps["opp-catalogue"].map(
          (step) => step.label,
        ),
      },
      {
        id: "example-run-catalogue-2",
        status: "completed",
        output: JSON.stringify({
          input: "sagrada tile magnet",
          sku: "BCN-GAUDI-03",
          alternatives: ["BCN-GAUDI-07"],
          confidence: "72%",
        }),
        durationMs: 71_000,
        createdAt: "2026-08-12 15:40:00",
        completedSteps: exampleRouteSteps["opp-catalogue"].map(
          (step) => step.label,
        ),
        reviewed: true,
      },
      {
        id: "example-run-catalogue-3",
        status: "completed",
        output: JSON.stringify({
          input: "costa brava boat",
          sku: "CB-BOAT-02",
          confidence: "91%",
        }),
        durationMs: 39_000,
        createdAt: "2026-08-11 10:22:00",
        completedSteps: exampleRouteSteps["opp-catalogue"]
          .filter((step) => step.kind !== "human")
          .map((step) => step.label),
      },
    ],
  },
  {
    id: "example-route-packing",
    opportunityId: "opp-packing",
    title: "Generate packing lists",
    description:
      "Consolidate confirmed orders into warehouse packing lists grouped by delivery route and pallet size.",
    hours: 3,
    systems: ["Salesforce", "Company knowledge"],
    createdAt: 3,
    steps: exampleRouteSteps["opp-packing"],
    executions: [
      {
        id: "example-run-packing-1",
        status: "completed",
        output: packingListOutput,
        outputName: "Packing list 13 Aug.md",
        outputType: "text/markdown",
        durationMs: 18_000,
        createdAt: "2026-08-13 07:05:00",
        completedSteps: exampleRouteSteps["opp-packing"].map(
          (step) => step.label,
        ),
      },
      {
        id: "example-run-packing-2",
        status: "completed",
        output: packingListOutput.replace("13 Aug 2026", "12 Aug 2026"),
        outputName: "Packing list 12 Aug.md",
        outputType: "text/markdown",
        durationMs: 21_000,
        createdAt: "2026-08-12 07:12:00",
        completedSteps: exampleRouteSteps["opp-packing"].map(
          (step) => step.label,
        ),
      },
    ],
  },
];
const amazonikLogo = "https://www.amazonik.es/www/web/logo/1-1511349621.png";
type Copy = {
  languageName: string;
  onboarding: {
    progress: (step: number) => string;
    introTag: string;
    introTitle: string;
    introDescription: string;
    introExplore: string;
    companyName: string;
    teamSize: string;
    companyDoes: string;
    companyDescriptionPlaceholder: string;
    departments: string;
    processes: string;
    bottlenecks: string;
    companyPlaceholder: string;
    departmentsPlaceholder: string;
    processesPlaceholder: string;
    bottlenecksPlaceholder: string;
    sourcesTag: string;
    sourcesTitle: string;
    sourcesDescription: string;
    companyKnowledge: string;
    uploadTitle: string;
    uploadHint: string;
    systems: string;
    localConnections: string;
    back: string;
    continue: string;
    findOpportunities: string;
    stepLabel: (current: number, total: number) => string;
    teamSizes: string[];
  };
  nav: {
    routes: string;
    opportunities: string;
    sources: string;
    routesHeading: string;
    routesEmpty: string;
    opportunitiesHeading: string;
    opportunitiesEmpty: string;
  };
  opportunities: {
    title: string;
    subtitle: string;
    newOpportunity: string;
    newOpportunityTitle: string;
    titleLabel: string;
    descriptionLabel: string;
    cancel: string;
    createOpportunity: string;
    newTab: string;
    usedTab: string;
    newEmpty: string;
    usedEmpty: string;
    deleteOpportunity: (title: string) => string;
    emptyTitle: string;
    emptyDescription: string;
    addSource: string;
    heading: (count: number) => string;
    inUseHeading: (count: number) => string;
    description: string;
    recommended: string;
    evidence: string;
    savedPerWeek: string;
    createRoute: string;
    confidenceLabel: string;
    mapTitle: string;
    impactAxis: string;
    effortAxis: string;
    highAxis: string;
    lowAxis: string;
    impact: Record<"High" | "Medium", string>;
    effort: Record<"Low" | "Medium", string>;
  };
  routes: {
    title: string;
    subtitle: (count: number) => string;
    emptyTitle: string;
    emptyDescription: string;
    viewOpportunities: string;
    overviewTitle: string;
    overviewDescription: string;
    active: string;
    runsThisWeek: string;
    success: string;
    savedPerWeek: string;
    hoursSavedEachWeek: string;
    openRoute: string;
    runRoute: string;
    running: string;
    routeComplete: string;
    waitingForReview: string;
    backToRoutes: string;
    pastExecutions: string;
    completedStatus: string;
    failedStatus: string;
    fixRoute: string;
    reviewStatus: string;
    justNow: string;
    stepProgress: (step: number, total: number) => string;
    activeRoutes: (count: number) => string;
    deleteRoute: (title: string) => string;
    deleteRouteTitle: (title: string) => string;
    deleteRouteDescription: string;
    cancelDelete: string;
    confirmDelete: string;
  };
  review: {
    title: string;
    description: string;
    continue: string;
    choices: readonly [string, string][];
  };
  sources: {
    title: string;
    subtitle: string;
    connectedSystems: string;
    companyKnowledge: string;
    connected: string;
    ready: string;
    noDocuments: string;
    departments: string;
    bottlenecks: string;
    notProvided: string;
    editProfile: string;
    save: string;
    cancel: string;
    connect: string;
    disconnect: string;
    more: string;
    allSystems: string;
    searchSystems: string;
    noMatchingSystems: string;
    catalogError: string;
    catalogUnavailable: string;
  };
  flow: {
    newItem: string;
    collectContext: string;
    readSourceData: string;
    aiTransformation: string;
    confidenceCheck: string;
    confidenceQuestion: string;
    humanReview: string;
    resolveUncertainty: string;
    updateDestination: (destination: string) => string;
    completeAction: string;
    routeComplete: string;
    destinationReached: string;
    reviewEdge: string;
    confidenceEdge: string;
    configuration: string;
    usesConnectedAccount: (system: string) => string;
    completed: string;
    outputPassed: string;
    nodeKinds: Record<FlowData["kind"], string>;
    routePrefixes: RegExp;
  };
  states: {
    connected: string;
  };
};

const translations: Record<Lang, Copy> = {
  en: {
    languageName: "English",
    onboarding: {
      progress: (step) => `${step} of 2`,
      introTag: "Let’s get oriented",
      introTitle: "Tell us how your company works.",
      introDescription:
        "A little context helps Heighliner find useful routes instead of generic automation ideas.",
      introExplore: "Explore with Amazonik",
      companyName: "Company name",
      teamSize: "Team size",
      companyDoes: "What does the company do?",
      companyDescriptionPlaceholder:
        "We design and distribute premium gifts across Europe.",
      departments: "Departments",
      processes: "Repetitive processes",
      bottlenecks: "Where does work get stuck?",
      companyPlaceholder: "Amazonik",
      departmentsPlaceholder: "Sales, operations, support",
      processesPlaceholder: "Order entry, weekly reporting",
      bottlenecksPlaceholder: "Manual product matching and repeated data entry",
      sourcesTag: "Add company context",
      sourcesTitle: "Connect the places where work happens.",
      sourcesDescription:
        "Upload knowledge and choose the systems Heighliner should consider.",
      companyKnowledge: "Company knowledge",
      uploadTitle: "Choose files or drop them here",
      uploadHint: "PDF, Excel, CSV, Documents, Images",
      systems: "Systems",
      localConnections: "Demo connections are stored locally in this browser.",
      back: "Back",
      continue: "Continue",
      findOpportunities: "Find opportunities",
      stepLabel: (current, total) => `${current} of ${total}`,
      teamSizes: ["1–10", "11–50", "51–200", "201–500", "500+"],
    },
    nav: {
      routes: "Routes",
      opportunities: "Opportunities",
      sources: "Sources",
      routesHeading: "Your routes",
      routesEmpty: "Create a route from an opportunity.",
      opportunitiesHeading: "Your opportunities",
      opportunitiesEmpty: "No opportunities yet.",
    },
    opportunities: {
      title: "Opportunities",
      subtitle: "Routes Heighliner found from your company context",
      newOpportunity: "New opportunity",
      newOpportunityTitle: "Create an opportunity",
      titleLabel: "Title",
      descriptionLabel: "Description",
      cancel: "Cancel",
      createOpportunity: "Create opportunity",
      newTab: "Found",
      usedTab: "In use",
      newEmpty: "No opportunities found.",
      usedEmpty: "No opportunities in use yet.",
      deleteOpportunity: (title) => `Delete ${title}`,
      emptyTitle: "Add your first source",
      emptyDescription:
        "Share a file or connect a system so Heighliner can find opportunities for you.",
      addSource: "Add a source",
      heading: (count) => `${count} valuable routes found.`,
      inUseHeading: (count) => `${count} valuable routes in use.`,
      description:
        "Start with the highest-confidence route. You can inspect and change every step before running it.",
      recommended: "Recommended",
      evidence: "Evidence:",
      savedPerWeek: "saved / week",
      createRoute: "Create route",
      confidenceLabel: "confidence",
      mapTitle: "Impact × Effort",
      impactAxis: "Impact",
      effortAxis: "Effort",
      highAxis: "High",
      lowAxis: "Low",
      impact: { High: "High", Medium: "Medium" },
      effort: { Low: "Low", Medium: "Medium" },
    },
    routes: {
      title: "Routes",
      subtitle: (count) =>
        `${count} active ${count === 1 ? "route" : "routes"}`,
      emptyTitle: "Create your first route",
      emptyDescription:
        "Choose an opportunity and Heighliner will build the route from your connected systems.",
      viewOpportunities: "View opportunities",
      overviewTitle: "Your routes",
      overviewDescription: "AI-powered processes running across Amazonik.",
      active: "Active",
      runsThisWeek: "runs this week",
      success: "success",
      savedPerWeek: "saved / week",
      hoursSavedEachWeek: "hours saved each week",
      openRoute: "Open route",
      runRoute: "Run route",
      running: "Running",
      routeComplete: "Route complete",
      waitingForReview: "Waiting for review",
      backToRoutes: "Back to routes",
      pastExecutions: "Runs",
      completedStatus: "Completed",
      failedStatus: "Error",
      fixRoute: "Fix route",
      reviewStatus: "Reviewed",
      justNow: "Just now",
      stepProgress: (step, total) => `Running step ${step} of ${total}`,
      activeRoutes: (count) =>
        `${count} active ${count === 1 ? "route" : "routes"}`,
      deleteRoute: (title) => `Delete ${title}`,
      deleteRouteTitle: (title) => `Delete ${title}?`,
      deleteRouteDescription:
        "This route and its run history will be permanently deleted.",
      cancelDelete: "Cancel",
      confirmDelete: "Delete route",
    },
    review: {
      title: "Confirm the best match",
      description:
        "Heighliner found two possible results. Choose one to continue.",
      continue: "Continue route",
      choices: [
        ["BCN-GAUDI-03", "72%"],
        ["BCN-GAUDI-07", "68%"],
      ],
    },
    sources: {
      title: "Sources",
      subtitle: "The context Heighliner uses to discover routes",
      connectedSystems: "Connected systems",
      companyKnowledge: "Company knowledge",
      connected: "Connected",
      ready: "Ready",
      noDocuments:
        "No documents uploaded. Heighliner is using your company description.",
      departments: "Departments",
      bottlenecks: "Bottlenecks",
      notProvided: "Not provided",
      editProfile: "Edit",
      save: "Save",
      cancel: "Cancel",
      connect: "Connect",
      disconnect: "Disconnect",
      more: "More",
      allSystems: "All systems",
      searchSystems: "Search systems",
      noMatchingSystems: "No systems match that search.",
      catalogError: "Could not load systems.",
      catalogUnavailable: "Run it yourself and connect it to Composio.",
    },
    flow: {
      newItem: "New item received",
      collectContext: "Collect context",
      readSourceData: "Read source data",
      aiTransformation: "AI transformation",
      confidenceCheck: "Confidence check",
      confidenceQuestion: "Result above 90%?",
      humanReview: "Human review",
      resolveUncertainty: "Resolve uncertainty",
      updateDestination: (destination) => `Update ${destination}`,
      completeAction: "Complete the action",
      routeComplete: "Route complete",
      destinationReached: "Destination reached",
      reviewEdge: "Review",
      confidenceEdge: ">90%",
      configuration: "Configuration",
      usesConnectedAccount: (system) =>
        `Uses the connected ${system} account and company knowledge available to this route.`,
      completed: "Completed",
      outputPassed: "Output is available and was passed to the next step.",
      nodeKinds: {
        system: "System",
        ai: "AI",
        knowledge: "Knowledge",
        logic: "Logic",
        human: "Human",
      },
      routePrefixes: /^(Automate|Qualify|Resolve|Reconcile|Draft|Enrich)\s/i,
    },
    states: {
      connected: "Connected",
    },
  },
  es: {
    languageName: "Español",
    onboarding: {
      progress: (step) => `${step} de 2`,
      introTag: "Vamos a ubicarnos",
      introTitle: "Cuéntanos cómo funciona tu empresa.",
      introDescription:
        "Un poco de contexto ayuda a Heighliner a encontrar rutas útiles en lugar de ideas genéricas de automatización.",
      introExplore: "Explorar con Amazonik",
      companyName: "Nombre de la empresa",
      teamSize: "Tamaño del equipo",
      companyDoes: "¿A qué se dedica la empresa?",
      companyDescriptionPlaceholder:
        "Diseñamos y distribuimos regalos premium por toda Europa.",
      departments: "Departamentos",
      processes: "Procesos repetitivos",
      bottlenecks: "¿Dónde se atasca el trabajo?",
      companyPlaceholder: "Amazonik",
      departmentsPlaceholder: "Ventas, operaciones, soporte",
      processesPlaceholder: "Entrada de pedidos, informes semanales",
      bottlenecksPlaceholder:
        "Coincidencia manual de productos y repetición de carga de datos",
      sourcesTag: "Añade contexto de la empresa",
      sourcesTitle: "Conecta los lugares donde ocurre el trabajo.",
      sourcesDescription:
        "Carga conocimiento y elige los sistemas que Heighliner debe considerar.",
      companyKnowledge: "Conocimiento de la empresa",
      uploadTitle: "Elige archivos o suéltalos aquí",
      uploadHint: "PDF, Excel, CSV, documentos, imágenes",
      systems: "Sistemas",
      localConnections:
        "Las conexiones de demostración se guardan localmente en este navegador.",
      back: "Atrás",
      continue: "Continuar",
      findOpportunities: "Buscar oportunidades",
      stepLabel: (current, total) => `${current} de ${total}`,
      teamSizes: ["1–10", "11–50", "51–200", "201–500", "500+"],
    },
    nav: {
      routes: "Rutas",
      opportunities: "Oportunidades",
      sources: "Fuentes",
      routesHeading: "Tus rutas",
      routesEmpty: "Crea una ruta a partir de una oportunidad.",
      opportunitiesHeading: "Tus oportunidades",
      opportunitiesEmpty: "Aún no hay oportunidades.",
    },
    opportunities: {
      title: "Oportunidades",
      subtitle:
        "Rutas que Heighliner encontró a partir del contexto de tu empresa",
      newOpportunity: "Nueva oportunidad",
      newOpportunityTitle: "Crear una oportunidad",
      titleLabel: "Título",
      descriptionLabel: "Descripción",
      cancel: "Cancelar",
      createOpportunity: "Crear oportunidad",
      newTab: "Encontradas",
      usedTab: "En uso",
      newEmpty: "No se encontraron oportunidades.",
      usedEmpty: "Aún no hay oportunidades en uso.",
      deleteOpportunity: (title) => `Eliminar ${title}`,
      emptyTitle: "Añade tu primera fuente",
      emptyDescription:
        "Comparte un archivo o conecta un sistema para que Heighliner encuentre oportunidades.",
      addSource: "Añadir una fuente",
      heading: (count) => `Se encontraron ${count} rutas valiosas.`,
      inUseHeading: (count) => `${count} rutas valiosas en uso.`,
      description:
        "Empieza por la ruta con mayor confianza. Puedes inspeccionar y cambiar cada paso antes de ejecutarlo.",
      recommended: "Recomendada",
      evidence: "Evidencia:",
      savedPerWeek: "ahorradas / semana",
      createRoute: "Crear ruta",
      confidenceLabel: "confianza",
      mapTitle: "Impacto × Esfuerzo",
      impactAxis: "Impacto",
      effortAxis: "Esfuerzo",
      highAxis: "Alto",
      lowAxis: "Bajo",
      impact: { High: "Alta", Medium: "Media" },
      effort: { Low: "Bajo", Medium: "Medio" },
    },
    routes: {
      title: "Rutas",
      subtitle: (count) =>
        `${count} ruta${count === 1 ? "" : "s"} activa${count === 1 ? "" : "s"}`,
      emptyTitle: "Crea tu primera ruta",
      emptyDescription:
        "Elige una oportunidad y Heighliner construirá la ruta a partir de tus sistemas conectados.",
      viewOpportunities: "Ver oportunidades",
      overviewTitle: "Tus rutas",
      overviewDescription:
        "Procesos impulsados por IA ejecutándose en Amazonik.",
      active: "Activa",
      runsThisWeek: "ejecuciones esta semana",
      success: "éxito",
      savedPerWeek: "ahorradas / semana",
      hoursSavedEachWeek: "horas ahorradas cada semana",
      openRoute: "Abrir ruta",
      runRoute: "Ejecutar ruta",
      running: "Ejecutando",
      routeComplete: "Ruta completada",
      waitingForReview: "Esperando revisión",
      backToRoutes: "Volver a rutas",
      pastExecutions: "Ejecuciones",
      completedStatus: "Completada",
      failedStatus: "Error",
      fixRoute: "Corregir ruta",
      reviewStatus: "Revisada",
      justNow: "Ahora mismo",
      stepProgress: (step, total) => `Ejecutando paso ${step} de ${total}`,
      activeRoutes: (count) =>
        `${count} ruta${count === 1 ? "" : "s"} activa${count === 1 ? "" : "s"}`,
      deleteRoute: (title) => `Eliminar ${title}`,
      deleteRouteTitle: (title) => `¿Eliminar ${title}?`,
      deleteRouteDescription:
        "Esta ruta y su historial de ejecuciones se eliminarán permanentemente.",
      cancelDelete: "Cancelar",
      confirmDelete: "Eliminar ruta",
    },
    review: {
      title: "Confirma la mejor coincidencia",
      description:
        "Heighliner encontró dos resultados posibles. Elige uno para continuar.",
      continue: "Continuar ruta",
      choices: [
        ["BCN-GAUDI-03", "72%"],
        ["BCN-GAUDI-07", "68%"],
      ],
    },
    sources: {
      title: "Fuentes",
      subtitle: "El contexto que Heighliner usa para descubrir rutas",
      connectedSystems: "Sistemas conectados",
      companyKnowledge: "Conocimiento de la empresa",
      connected: "Conectado",
      ready: "Listo",
      noDocuments:
        "No se subieron documentos. Heighliner está usando la descripción de tu empresa.",
      departments: "Departamentos",
      bottlenecks: "Bloqueos",
      notProvided: "No proporcionado",
      editProfile: "Editar",
      save: "Guardar",
      cancel: "Cancelar",
      connect: "Conectar",
      disconnect: "Desconectar",
      more: "Más",
      allSystems: "Todos los sistemas",
      searchSystems: "Buscar sistemas",
      noMatchingSystems: "Ningún sistema coincide con esa búsqueda.",
      catalogError: "No se pudieron cargar los sistemas.",
      catalogUnavailable: "Ejecútalo tú mismo y conéctalo a Composio.",
    },
    flow: {
      newItem: "Nuevo elemento recibido",
      collectContext: "Recopilar contexto",
      readSourceData: "Leer datos fuente",
      aiTransformation: "Transformación con IA",
      confidenceCheck: "Comprobación de confianza",
      confidenceQuestion: "¿Resultado por encima del 90%?",
      humanReview: "Revisión humana",
      resolveUncertainty: "Resolver incertidumbre",
      updateDestination: (destination) => `Actualizar ${destination}`,
      completeAction: "Completar la acción",
      routeComplete: "Ruta completada",
      destinationReached: "Destino alcanzado",
      reviewEdge: "Revisar",
      confidenceEdge: ">90%",
      configuration: "Configuración",
      usesConnectedAccount: (system) =>
        `Usa la cuenta conectada de ${system} y el conocimiento de la empresa disponible para esta ruta.`,
      completed: "Completado",
      outputPassed: "El resultado está disponible y pasó al siguiente paso.",
      nodeKinds: {
        system: "Sistema",
        ai: "IA",
        knowledge: "Conocimiento",
        logic: "Lógica",
        human: "Humano",
      },
      routePrefixes:
        /^(Automatizar|Calificar|Resolver|Conciliar|Redactar|Enriquecer)\s/i,
    },
    states: {
      connected: "Conectado",
    },
  },
  nl: {
    languageName: "Nederlands",
    onboarding: {
      progress: (step) => `${step} van 2`,
      introTag: "Laten we beginnen",
      introTitle: "Vertel ons hoe je bedrijf werkt.",
      introDescription:
        "Een beetje context helpt Heighliner nuttige routes te vinden in plaats van generieke automatiseringsideeën.",
      introExplore: "Verken met Amazonik",
      companyName: "Bedrijfsnaam",
      teamSize: "Teamgrootte",
      companyDoes: "Wat doet het bedrijf?",
      companyDescriptionPlaceholder:
        "We ontwerpen en distribueren premium cadeaus door heel Europa.",
      departments: "Afdelingen",
      processes: "Repetitieve processen",
      bottlenecks: "Waar loopt het werk vast?",
      companyPlaceholder: "Amazonik",
      departmentsPlaceholder: "Sales, operations, support",
      processesPlaceholder: "Orderinvoer, wekelijkse rapportages",
      bottlenecksPlaceholder:
        "Handmatige productmatching en herhaalde gegevensinvoer",
      sourcesTag: "Voeg bedrijfscontext toe",
      sourcesTitle: "Koppel de plekken waar werk gebeurt.",
      sourcesDescription:
        "Upload kennis en kies de systemen die Heighliner moet meenemen.",
      companyKnowledge: "Bedrijfskennis",
      uploadTitle: "Kies bestanden of sleep ze hierheen",
      uploadHint: "PDF, Excel, CSV, documenten, afbeeldingen",
      systems: "Systemen",
      localConnections:
        "Demoverbindingen worden lokaal in deze browser opgeslagen.",
      back: "Terug",
      continue: "Doorgaan",
      findOpportunities: "Kansen vinden",
      stepLabel: (current, total) => `${current} van ${total}`,
      teamSizes: ["1–10", "11–50", "51–200", "201–500", "500+"],
    },
    nav: {
      routes: "Routes",
      opportunities: "Kansen",
      sources: "Bronnen",
      routesHeading: "Jouw routes",
      routesEmpty: "Maak een route vanuit een kans.",
      opportunitiesHeading: "Jouw kansen",
      opportunitiesEmpty: "Nog geen kansen.",
    },
    opportunities: {
      title: "Kansen",
      subtitle: "Routes die Heighliner vond op basis van je bedrijfscontext",
      newOpportunity: "Nieuwe kans",
      newOpportunityTitle: "Kans maken",
      titleLabel: "Titel",
      descriptionLabel: "Beschrijving",
      cancel: "Annuleren",
      createOpportunity: "Kans maken",
      newTab: "Gevonden",
      usedTab: "In gebruik",
      newEmpty: "Geen kansen gevonden.",
      usedEmpty: "Nog geen kansen in gebruik.",
      deleteOpportunity: (title) => `${title} verwijderen`,
      emptyTitle: "Voeg je eerste bron toe",
      emptyDescription:
        "Deel een bestand of koppel een systeem zodat Heighliner kansen voor je kan vinden.",
      addSource: "Bron toevoegen",
      heading: (count) => `${count} waardevolle routes gevonden.`,
      inUseHeading: (count) => `${count} waardevolle routes in gebruik.`,
      description:
        "Begin met de route met de hoogste betrouwbaarheid. Je kunt elke stap bekijken en aanpassen voordat je hem uitvoert.",
      recommended: "Aanbevolen",
      evidence: "Bewijs:",
      savedPerWeek: "bespaard / week",
      createRoute: "Route maken",
      confidenceLabel: "betrouwbaarheid",
      mapTitle: "Impact × Inspanning",
      impactAxis: "Impact",
      effortAxis: "Inspanning",
      highAxis: "Hoog",
      lowAxis: "Laag",
      impact: { High: "Hoog", Medium: "Gemiddeld" },
      effort: { Low: "Laag", Medium: "Gemiddeld" },
    },
    routes: {
      title: "Routes",
      subtitle: (count) =>
        `${count} actieve ${count === 1 ? "route" : "routes"}`,
      emptyTitle: "Maak je eerste route",
      emptyDescription:
        "Kies een kans en Heighliner bouwt de route vanuit je gekoppelde systemen.",
      viewOpportunities: "Bekijk kansen",
      overviewTitle: "Jouw routes",
      overviewDescription: "AI-gestuurde processen die draaien bij Amazonik.",
      active: "Actief",
      runsThisWeek: "runs deze week",
      success: "succes",
      savedPerWeek: "bespaard / week",
      hoursSavedEachWeek: "uur bespaard per week",
      openRoute: "Route openen",
      runRoute: "Route uitvoeren",
      running: "Bezig",
      routeComplete: "Route voltooid",
      waitingForReview: "Wacht op review",
      backToRoutes: "Terug naar routes",
      pastExecutions: "Runs",
      completedStatus: "Voltooid",
      failedStatus: "Fout",
      fixRoute: "Route herstellen",
      reviewStatus: "Beoordeeld",
      justNow: "Zojuist",
      stepProgress: (step, total) => `Stap ${step} van ${total} uitvoeren`,
      activeRoutes: (count) =>
        `${count} actieve ${count === 1 ? "route" : "routes"}`,
      deleteRoute: (title) => `${title} verwijderen`,
      deleteRouteTitle: (title) => `${title} verwijderen?`,
      deleteRouteDescription:
        "Deze route en de uitvoeringsgeschiedenis worden permanent verwijderd.",
      cancelDelete: "Annuleren",
      confirmDelete: "Route verwijderen",
    },
    review: {
      title: "Bevestig de beste match",
      description:
        "Heighliner vond twee mogelijke resultaten. Kies er een om door te gaan.",
      continue: "Route voortzetten",
      choices: [
        ["BCN-GAUDI-03", "72%"],
        ["BCN-GAUDI-07", "68%"],
      ],
    },
    sources: {
      title: "Bronnen",
      subtitle: "De context die Heighliner gebruikt om routes te ontdekken",
      connectedSystems: "Gekoppelde systemen",
      companyKnowledge: "Bedrijfskennis",
      connected: "Gekoppeld",
      ready: "Gereed",
      noDocuments:
        "Geen documenten geüpload. Heighliner gebruikt je bedrijfsbeschrijving.",
      departments: "Afdelingen",
      bottlenecks: "Knelpunten",
      notProvided: "Niet opgegeven",
      editProfile: "Bewerken",
      save: "Opslaan",
      cancel: "Annuleren",
      connect: "Koppelen",
      disconnect: "Ontkoppelen",
      more: "Meer",
      allSystems: "Alle systemen",
      searchSystems: "Systemen zoeken",
      noMatchingSystems: "Geen systemen komen overeen met die zoekopdracht.",
      catalogError: "Systemen konden niet worden geladen.",
      catalogUnavailable: "Draai het zelf en koppel het aan Composio.",
    },
    flow: {
      newItem: "Nieuw item ontvangen",
      collectContext: "Context verzamelen",
      readSourceData: "Brongegevens lezen",
      aiTransformation: "AI-transformatie",
      confidenceCheck: "Betrouwbaarheidscheck",
      confidenceQuestion: "Resultaat boven 90%?",
      humanReview: "Menselijke review",
      resolveUncertainty: "Onzekerheid oplossen",
      updateDestination: (destination) => `${destination} bijwerken`,
      completeAction: "Actie voltooien",
      routeComplete: "Route voltooid",
      destinationReached: "Bestemming bereikt",
      reviewEdge: "Review",
      confidenceEdge: ">90%",
      configuration: "Configuratie",
      usesConnectedAccount: (system) =>
        `Gebruikt het gekoppelde ${system}-account en de bedrijfskennis die beschikbaar is voor deze route.`,
      completed: "Voltooid",
      outputPassed:
        "Output is beschikbaar en is doorgegeven aan de volgende stap.",
      nodeKinds: {
        system: "Systeem",
        ai: "AI",
        knowledge: "Kennis",
        logic: "Logica",
        human: "Mens",
      },
      routePrefixes: /^(Automate|Qualify|Resolve|Reconcile|Draft|Enrich)\s/i,
    },
    states: {
      connected: "Gekoppeld",
    },
  },
};

const LocaleContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  copy: Copy;
} | null>(null);

function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleContext missing");
  return context;
}

function Logo({ onClick }: { onClick?: () => void }) {
  const mark = (
    <>
      <img
        src="/heighliner-logo.svg"
        alt=""
        className="h-[18px] w-auto shrink-0"
      />
      <span className="wordmark text-[17px] font-semibold tracking-[-.035em]">
        Heighliner
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="pressable flex items-center gap-1.5"
      >
        {mark}
      </button>
    );
  }

  return <div className="flex items-center gap-1.5">{mark}</div>;
}

type LandingCopy = {
  navContact: string;
  title: string;
  body: string;
  contactButton: string;
  demo: string;
  deploy: string;
  previewTag: string;
  previewTitle: string;
  opportunity: string;
  opportunityBody: string;
  saved: string;
  routeTitle: string;
  steps: [string, string][];
  contactTitle: string;
  contactBody: string;
  fields: {
    company: string;
    email: string;
    size: string;
    does: string;
    bottlenecks: string;
  };
  optional: string;
  submit: string;
  submitSuccess: string;
  submitError: string;
  exampleTitle: string;
  exampleBody: string;
  exampleButton: string;
  note: string;
  preview: {
    navRoutes: string;
    navOpportunities: string;
    navSources: string;
    headerTitle: string;
    analysisComplete: string;
    discoveryComplete: string;
    recommended: string;
    impactEffort: string;
    lowerEffort: string;
    higherImpact: string;
    savedPerWeek: string;
    cards: [string, string, string];
  };
};

const landingCopy: Record<Lang, LandingCopy> = {
  en: {
    navContact: "Contact",
    title: "Find and automate your company’s repetitive work.",
    body: "You don’t need to know what to automate. Tell Heighliner how your company works and it will find the opportunities for you.",
    contactButton: "Tell us about your company",
    demo: "View an example",
    deploy: "Host it yourself",
    previewTag: "your company workspace",
    previewTitle: "6 valuable routes found",
    opportunity: "Automate incoming orders",
    opportunityBody:
      "Extract orders from WhatsApp and email, validate products, and create clean records in Salesforce.",
    saved: "8h saved / week",
    routeTitle:
      "After one interview, we connect your systems in a day. Then Heighliner finds the opportunities, builds the routes, and takes repetitive work off your team.",
    steps: [
      [
        "Connect your sources",
        "We interview your team and connect the systems and knowledge where work happens—in one day.",
      ],
      [
        "Find the opportunities",
        "Heighliner studies the work and identifies where automation will have the biggest impact.",
      ],
      [
        "Build the routes",
        "The AI turns each opportunity into a clear workflow across your existing systems.",
      ],
      [
        "Make repetitive work run itself",
        "Routes keep running, your team handles fewer manual tasks, and the company becomes more efficient.",
      ],
    ],
    contactTitle: "Tell us how your company works.",
    contactBody:
      "You don’t need to prepare a list of processes to automate. Share the basics and, if you want, where work gets stuck; Heighliner will find and prioritize the best opportunities anyway.",
    fields: {
      company: "Company name",
      email: "Contact email",
      size: "Team size",
      does: "What does the company do?",
      bottlenecks: "Where does work get stuck?",
    },
    optional: "Optional, Heighliner will find this anyway",
    submit: "Send inquiry",
    submitSuccess: "We'll reach out as soon as possible.",
    submitError: "Something went wrong. Please try again.",
    exampleTitle: "See how it worked for a small souvenir company in Spain.",
    exampleBody:
      "Explore a real workspace, the opportunities Heighliner found, and the routes it built.",
    exampleButton: "View an example",
    note: "AI automation discovery, design, and implementation.",
    preview: {
      navRoutes: "Routes",
      navOpportunities: "Opportunities",
      navSources: "Sources",
      headerTitle: "Routes",
      analysisComplete: "Analysis complete",
      discoveryComplete: "Discovery complete",
      recommended: "Recommended",
      impactEffort: "Impact × effort",
      lowerEffort: "Lower effort",
      higherImpact: "Higher impact",
      savedPerWeek: "saved / week",
      cards: [
        "Qualify inbound leads",
        "Resolve support requests",
        "Reconcile invoices",
      ],
    },
  },
  es: {
    navContact: "Contacto",
    title: "Encontramos y automatizamos el trabajo repetitivo de tu empresa.",
    body: "No tienes que saber qué automatizar. Cuéntale a Heighliner cómo funciona tu empresa y encontrará las oportunidades por ti.",
    contactButton: "Cuéntanos sobre tu empresa",
    demo: "Ver un ejemplo",
    deploy: "Despliega el tuyo",
    previewTag: "Espacio de trabajo de tu empresa",
    previewTitle: "6 rutas valiosas encontradas",
    opportunity: "Automatizar pedidos entrantes",
    opportunityBody:
      "Extrae pedidos de WhatsApp y email, valida productos y crea registros limpios en Salesforce.",
    saved: "8 h ahorradas / semana",
    routeTitle:
      "Tras una entrevista, conectamos tus sistemas en un día. Después, Heighliner encuentra las oportunidades, construye las rutas y libera a tu equipo del trabajo repetitivo.",
    steps: [
      [
        "Conecta tus fuentes",
        "Entrevistamos a tu equipo y conectamos en un día los sistemas y el conocimiento donde ocurre el trabajo.",
      ],
      [
        "Encuentra las oportunidades",
        "Heighliner estudia el trabajo e identifica dónde tendrá mayor impacto la automatización.",
      ],
      [
        "Construye las rutas",
        "La IA convierte cada oportunidad en un flujo claro entre tus sistemas actuales.",
      ],
      [
        "Automatiza el trabajo repetitivo",
        "Las rutas siguen funcionando, tu equipo hace menos tareas manuales y la empresa se vuelve más eficiente.",
      ],
    ],
    contactTitle: "Cuéntanos cómo funciona tu empresa.",
    contactBody:
      "No necesitas preparar una lista de procesos para automatizar. Comparte lo básico y, si quieres, dónde se atasca el trabajo; Heighliner encontrará y priorizará igualmente las mejores oportunidades.",
    fields: {
      company: "Nombre de la empresa",
      email: "Email de contacto",
      size: "Tamaño del equipo",
      does: "¿A qué se dedica la empresa?",
      bottlenecks: "¿Dónde se atasca el trabajo?",
    },
    optional: "Opcional, Heighliner lo encontrará igualmente",
    submit: "Enviar consulta",
    submitSuccess: "Nos pondremos en contacto lo antes posible.",
    submitError: "Algo salió mal. Inténtalo de nuevo.",
    exampleTitle:
      "Mira cómo funcionó para una pequeña empresa de souvenirs en España.",
    exampleBody:
      "Explora un espacio de trabajo real, las oportunidades que encontró Heighliner y las rutas que construyó.",
    exampleButton: "Ver un ejemplo",
    note: "Descubrimiento, diseño e implementación de automatizaciones con IA.",
    preview: {
      navRoutes: "Rutas",
      navOpportunities: "Oportunidades",
      navSources: "Fuentes",
      headerTitle: "Rutas",
      analysisComplete: "Análisis completo",
      discoveryComplete: "Descubrimiento completo",
      recommended: "Recomendada",
      impactEffort: "Impacto × esfuerzo",
      lowerEffort: "Menor esfuerzo",
      higherImpact: "Mayor impacto",
      savedPerWeek: "ahorradas / semana",
      cards: ["Calificar leads", "Resolver soporte", "Conciliar facturas"],
    },
  },
  nl: {
    navContact: "Contact",
    title: "We vinden en automatiseren het repetitieve werk van je bedrijf.",
    body: "Je hoeft niet te weten wat je moet automatiseren. Vertel Heighliner hoe je bedrijf werkt en het vindt de kansen voor je.",
    contactButton: "Vertel ons over je bedrijf",
    demo: "Bekijk een voorbeeld",
    deploy: "Zet het zelf live",
    previewTag: "Werkruimte van je bedrijf",
    previewTitle: "6 waardevolle routes gevonden",
    opportunity: "Inkomende orders automatiseren",
    opportunityBody:
      "Haal orders uit WhatsApp en e-mail, valideer producten en maak schone records in Salesforce.",
    saved: "8 uur bespaard / week",
    routeTitle:
      "Na één interview koppelen we je systemen binnen een dag. Daarna vindt Heighliner de kansen, bouwt de routes en neemt repetitief werk uit handen.",
    steps: [
      [
        "Koppel je bronnen",
        "We interviewen je team en koppelen binnen een dag de systemen en kennis waar het werk gebeurt.",
      ],
      [
        "Vind de kansen",
        "Heighliner bestudeert het werk en ontdekt waar automatisering de meeste impact heeft.",
      ],
      [
        "Bouw de routes",
        "De AI zet elke kans om in een duidelijke workflow over je bestaande systemen.",
      ],
      [
        "Laat repetitief werk zichzelf uitvoeren",
        "Routes blijven draaien, je team doet minder handmatig werk en het bedrijf wordt efficiënter.",
      ],
    ],
    contactTitle: "Vertel ons hoe je bedrijf werkt.",
    contactBody:
      "Je hoeft geen lijst met te automatiseren processen klaar te hebben. Deel de basis en, als je wilt, waar werk vastloopt; Heighliner vindt en prioriteert alsnog de beste kansen.",
    fields: {
      company: "Bedrijfsnaam",
      email: "Contact-e-mail",
      size: "Teamgrootte",
      does: "Wat doet het bedrijf?",
      bottlenecks: "Waar loopt het werk vast?",
    },
    optional: "Optioneel, Heighliner vindt dit toch wel",
    submit: "Aanvraag versturen",
    submitSuccess: "We nemen zo snel mogelijk contact met je op.",
    submitError: "Er ging iets mis. Probeer het opnieuw.",
    exampleTitle:
      "Bekijk hoe het werkte voor een klein souvenirbedrijf in Spanje.",
    exampleBody:
      "Verken een echte werkruimte, de kansen die Heighliner vond en de routes die het bouwde.",
    exampleButton: "Bekijk een voorbeeld",
    note: "Ontdekking, ontwerp en implementatie van AI-automatisering.",
    preview: {
      navRoutes: "Routes",
      navOpportunities: "Kansen",
      navSources: "Bronnen",
      headerTitle: "Routes",
      analysisComplete: "Analyse voltooid",
      discoveryComplete: "Ontdekking voltooid",
      recommended: "Aanbevolen",
      impactEffort: "Impact × inspanning",
      lowerEffort: "Minder inspanning",
      higherImpact: "Meer impact",
      savedPerWeek: "bespaard / week",
      cards: [
        "Inbound leads kwalificeren",
        "Supportverzoeken oplossen",
        "Facturen afstemmen",
      ],
    },
  },
};

function WorkspaceAccount({
  compact,
  name = "your company",
  subtitle,
  logoSrc,
  logoAlt = "",
  onContact,
}: {
  compact?: boolean;
  name?: string;
  subtitle?: string;
  logoSrc?: string;
  logoAlt?: string;
  onContact?: () => void;
}) {
  const { lang } = useLocale();
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!onContact) return;
    const close = (event: PointerEvent) => {
      if (
        !details.current?.contains(
          event.target instanceof Element ? event.target : null,
        )
      ) {
        details.current?.removeAttribute("open");
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [onContact]);
  const account = (
    <div
      className={`flex items-center gap-3 ${compact ? "px-0 py-0" : "px-3 py-2.5"}`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={logoAlt}
          className={`shrink-0 object-contain ${compact ? "h-7 w-7 rounded-[8px]" : "h-10 w-10 rounded-[10px]"}`}
        />
      ) : (
        <span
          className={`grid shrink-0 place-items-center rounded-[10px] bg-[#ececea] text-[#555550] ${compact ? "h-7 w-7" : "h-8 w-8"}`}
        >
          <HugeiconsIcon icon={BoxesIcon} size={compact ? 14 : 16} />
        </span>
      )}
      <div className="min-w-0">
        <div
          className={`truncate font-medium ${compact ? "text-[10px]" : "text-[11px]"}`}
        >
          {name}
        </div>
        {subtitle ? (
          <div
            className={`truncate text-[#999994] ${compact ? "text-[9px]" : "text-[10px]"}`}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {onContact ? (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={12}
          className="ml-auto rotate-[-90deg] text-[#999994] transition group-open:rotate-90"
        />
      ) : null}
    </div>
  );

  if (!onContact) return account;

  return (
    <details ref={details} className="group relative">
      <summary className="pressable cursor-pointer list-none rounded-[13px] hover:bg-black/[.04] [&::-webkit-details-marker]:hidden">
        {account}
      </summary>
      <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-full rounded-[16px] border border-black/[.06] bg-white p-3 shadow-[0_12px_35px_rgba(0,0,0,.12)]">
        <p className="px-1 pb-3 text-[12px] font-medium leading-5 text-[#555550]">
          {accountCtaByLang[lang].prompt}
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            onContact();
          }}
          className="pressable flex w-full items-center justify-between rounded-[11px] bg-[#20201f] px-3 py-2.5 text-left text-[11px] font-medium text-white hover:bg-black"
        >
          {accountCtaByLang[lang].action}
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
        </button>
      </div>
    </details>
  );
}

function Landing({ explore }: { explore: () => void }) {
  const { lang } = useLocale();
  const [lead, setLead] = useState(leadDefaults);
  const [email, setEmail] = useState("");
  const [activeJourney, setActiveJourney] = useState(0);
  const [inquiryState, setInquiryState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const copy = landingCopy[lang];
  const clearInquiryError = () => {
    if (inquiryState === "error") setInquiryState("idle");
  };
  const updateLead = (key: keyof Company, value: string) => {
    clearInquiryError();
    setLead((current) => ({ ...current, [key]: value }));
  };
  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInquiryState("submitting");
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: lead.name,
          email,
          size: lead.size,
          description: lead.description,
          bottlenecks: lead.bottlenecks,
        }),
      });
      if (!response.ok) throw new Error("Inquiry failed");
      setInquiryState("success");
    } catch {
      setInquiryState("error");
    }
  };
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f5] px-5 text-[#20201f] sm:px-7 lg:px-10">
      <header className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between">
        <Logo />
        <div className="flex items-center gap-5">
          <a
            href="#contact"
            className="pressable text-[12px] font-medium text-[#696964] hover:text-black"
          >
            {copy.navContact}
          </a>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] pb-24 sm:pb-32">
        <section className="grid items-center gap-14 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:grid-cols-[.78fr_1.22fr] lg:gap-16 lg:pt-14">
          <div className="text-center lg:text-left">
            <h1 className="mx-auto max-w-[920px] text-[clamp(2.5rem,5vw,4.4rem)] font-semibold leading-[.9] tracking-[-.075em] lg:mx-0">
              {copy.title}
            </h1>
            <p className="mx-auto mt-7 max-w-[590px] text-[15px] leading-7 text-[#6f6f6a] sm:text-[17px] lg:mx-0 lg:max-w-[460px]">
              {copy.body}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <a
                href="#contact"
                className="pressable inline-flex items-center gap-2 rounded-full bg-[#20201f] px-5 py-3 text-[13px] font-medium text-white hover:bg-black"
              >
                {copy.contactButton}
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </a>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex items-center gap-2 rounded-full bg-black/[.055] px-5 py-3 text-[13px] font-medium hover:bg-black/[.09]"
              >
                <GitHubMark className="h-4 w-4" />
                {copy.deploy}
              </a>
            </div>
          </div>

          <div
            aria-label="Heighliner dashboard preview"
            className="group relative min-w-0 lg:w-[143%]"
          >
            <div className="absolute inset-x-[12%] bottom-0 h-2/3 rounded-full bg-[#ff7a35]/15 blur-[100px]" />
            <div className="relative rounded-[28px] border border-black/[.08] bg-[#e9e9e6] p-2 shadow-[0_35px_100px_rgba(27,27,25,.14)] transition-[filter] duration-200 ease-[cubic-bezier(.23,1,.32,1)] group-hover:blur-[3px] group-focus-within:blur-[3px] sm:rounded-[36px] sm:p-3">
              <div className="grid min-h-[520px] overflow-hidden rounded-[22px] bg-[#f7f7f5] sm:rounded-[28px] xl:grid-cols-[150px_1fr]">
                <aside className="hidden min-h-full flex-col border-r border-black/[.06] bg-white/70 p-4 xl:flex">
                  <Logo />
                  <div className="mt-9 space-y-1 text-[11px]">
                    <div>
                      <div className="flex items-center gap-2.5 rounded-[10px] bg-black/[.06] px-3 py-2.5 font-medium">
                        <HugeiconsIcon icon={Route01Icon} size={14} />
                        <span className="min-w-0 flex-1 truncate">
                          {copy.preview.navRoutes}
                        </span>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={10}
                          className="rotate-90 text-[#999994]"
                        />
                      </div>
                      <div className="mt-1 space-y-1 pl-2">
                        {[
                          copy.opportunity,
                          ...copy.preview.cards.slice(0, 2),
                        ].map((route, index) => (
                          <div
                            key={route}
                            className={`flex items-center gap-2 rounded-[9px] px-2 py-2 ${index === 0 ? "bg-white shadow-sm" : "text-[#777772]"}`}
                          >
                            <span className="h-1 w-1 shrink-0 rounded-full bg-[#c8c7c1]" />
                            <span className="truncate text-[9px] font-medium">
                              {route}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {[
                      [SparklesIcon, copy.preview.navOpportunities],
                      [Database01Icon, copy.preview.navSources],
                    ].map(([icon, label]) => (
                      <div
                        key={String(label)}
                        className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[#777772]"
                      >
                        <HugeiconsIcon
                          icon={icon as typeof Route01Icon}
                          size={14}
                        />
                        {String(label)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto border-t border-black/[.06] pt-5">
                    <WorkspaceAccount compact />
                  </div>
                </aside>

                <div className="min-w-0">
                  <div className="flex h-16 items-center justify-between border-b border-black/[.06] bg-white/50 px-5 sm:px-8">
                    <div>
                      <p className="text-[12px] font-semibold">
                        {copy.preview.headerTitle}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#999994]">
                        {copy.previewTag}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#edf6ef] px-2.5 py-1 text-[9px] font-semibold text-[#3f7b50]">
                      {copy.preview.analysisComplete}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h2 className="text-[27px] font-semibold tracking-[-.05em] sm:text-[34px]">
                      {copy.previewTitle}
                    </h2>
                    <div className="mt-7 grid gap-3 lg:grid-cols-[1.3fr_.7fr]">
                      <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_35px_rgba(0,0,0,.04)]">
                        <div className="flex items-start justify-between gap-4">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#fff0e8] text-[#d8551d]">
                            <HugeiconsIcon icon={Route01Icon} size={17} />
                          </span>
                          <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-[9px] font-semibold text-[#c65323]">
                            {copy.preview.recommended}
                          </span>
                        </div>
                        <h3 className="mt-5 text-[17px] font-semibold tracking-[-.03em]">
                          {copy.opportunity}
                        </h3>
                        <p className="mt-2 max-w-lg text-[11px] leading-5 text-[#777772]">
                          {copy.opportunityBody}
                        </p>
                        <div className="mt-6 flex items-center justify-between border-t border-black/[.06] pt-4">
                          <span className="flex items-center gap-2 text-[10px] text-[#777772]">
                            WhatsApp · Gmail{" "}
                            <span className="text-[#bbb]">→</span> Salesforce
                          </span>
                          <span className="text-[10px] font-semibold">
                            {copy.saved}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-[20px] bg-[#20201f] p-5 text-white">
                        <p className="text-[11px] font-medium text-white/45">
                          {copy.preview.impactEffort}
                        </p>
                        <div className="relative mt-5 h-[150px] rounded-[15px] border border-white/10">
                          <span className="absolute left-[68%] top-[24%] h-3 w-3 rounded-full bg-[#ff7a35] ring-4 ring-[#ff7a35]/20" />
                          <span className="absolute left-[35%] top-[52%] h-2.5 w-2.5 rounded-full bg-white/45" />
                          <span className="absolute left-[76%] top-[64%] h-2 w-2 rounded-full bg-white/30" />
                          <span className="absolute bottom-3 left-3 text-[8px] text-white/35">
                            {copy.preview.lowerEffort}
                          </span>
                          <span className="absolute right-3 top-3 text-[8px] text-white/35">
                            {copy.preview.higherImpact}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {copy.preview.cards.map((title, index) => (
                        <div
                          key={title}
                          className="rounded-[17px] border border-black/[.06] bg-white/60 p-4"
                        >
                          <p className="truncate text-[10px] font-medium">
                            {title}
                          </p>
                          <p className="mt-3 text-[15px] font-semibold">
                            {["5h", "4h", "3h"][index]}
                          </p>
                          <p className="text-[8px] text-[#999994]">
                            {copy.preview.savedPerWeek}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[28px] bg-white/10 opacity-0 transition-opacity duration-200 ease-[cubic-bezier(.23,1,.32,1)] group-hover:opacity-100 group-focus-within:opacity-100 sm:rounded-[36px]">
              <button
                type="button"
                onClick={explore}
                className="pressable pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#20201f] px-5 py-3 text-[13px] font-medium text-white shadow-[0_12px_35px_rgba(0,0,0,.22)] transition-transform duration-150 ease-out hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a35] focus-visible:ring-offset-2"
              >
                {copy.demo}
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1180px]">
          <section className="border-t border-black/[.08] py-24 sm:py-32">
            <h2 className="max-w-3xl text-[18px] font-medium leading-7 tracking-[-.02em] text-[#555550] sm:text-[20px]">
              {copy.routeTitle}
            </h2>
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.12fr_.88fr] lg:items-stretch">
              <div className="min-h-[500px] overflow-hidden rounded-[30px] bg-[#20201f] p-6 text-white sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#ff8a4d]">
                    {activeJourney + 1} · {copy.steps[activeJourney][0]}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#6fc783] shadow-[0_0_0_5px_rgba(111,199,131,.1)]" />
                </div>

                <div key={activeJourney} className="landing-journey-visual">
                  {activeJourney === 0 && (
                    <div className="grid h-[410px] place-items-center">
                      <div className="grid w-full max-w-[520px] grid-cols-[1fr_56px_1.1fr] items-center gap-y-3">
                        {["WhatsApp", "Gmail", "Salesforce"].map(
                          (system, index) => (
                            <div key={system} className="contents">
                              <div className="flex items-center gap-3 rounded-[15px] border border-white/10 bg-white/[.055] p-3.5">
                                <SystemMark name={system} />
                                <span className="text-[10px] font-medium">
                                  {system}
                                </span>
                              </div>
                              <div className="relative h-px bg-white/15">
                                <span
                                  className="landing-source-pulse"
                                  style={{ animationDelay: `${index * 0.3}s` }}
                                />
                              </div>
                              {index === 0 ? (
                                <div className="row-span-3 flex h-full min-h-[190px] flex-col items-center justify-center rounded-[22px] border border-[#ff8a4d]/30 bg-[#ff7a35]/10 p-5 text-center">
                                  <HugeiconsIcon
                                    icon={Database01Icon}
                                    size={22}
                                  />
                                  <p className="mt-4 text-[13px] font-semibold">
                                    {
                                      translations[lang].sources
                                        .companyKnowledge
                                    }
                                  </p>
                                  <p className="mt-2 text-[9px] leading-4 text-white/45">
                                    {
                                      translations[lang].sources
                                        .connectedSystems
                                    }
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {activeJourney === 1 && (
                    <div className="flex h-[410px] flex-col justify-center">
                      <p className="text-[11px] text-white/45">
                        {copy.preview.discoveryComplete}
                      </p>
                      <h3 className="mt-2 text-[28px] font-semibold tracking-[-.045em]">
                        {copy.previewTitle}
                      </h3>
                      <div className="mt-7 space-y-2.5">
                        {[
                          copy.opportunity,
                          ...copy.preview.cards.slice(0, 2),
                        ].map((title, index) => (
                          <div
                            key={title}
                            className="landing-result-card flex items-center gap-4 rounded-[16px] border border-white/10 bg-white/[.055] p-4"
                            style={{ animationDelay: `${index * 55}ms` }}
                          >
                            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/10 text-[#ff9a69]">
                              <HugeiconsIcon icon={SparklesIcon} size={15} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                              {title}
                            </span>
                            <span className="text-[10px] font-semibold text-white/55">
                              {["8h", "5h", "4h"][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJourney === 2 && (
                    <div className="mt-3 h-[397px] overflow-hidden p-4">
                      <p className="text-[9px] font-medium text-white/40">
                        {copy.opportunity}
                      </p>
                      <div className="relative mx-auto mt-3 w-full max-w-[440px]">
                        <svg
                          aria-hidden="true"
                          className="landing-route-traveler pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
                          viewBox="0 0 440 320"
                          preserveAspectRatio="none"
                        >
                          {Array.from({ length: 6 }, (_, index) => ({
                            begin: `${index * 1.5}s`,
                            path:
                              index % 2 === 0
                                ? "M220 60 V224 H106 V260"
                                : "M220 60 V224 H334 V260",
                          })).map(({ begin, path }) => (
                            <g key={begin}>
                              <circle r="5" fill="#ff8a4d" opacity="0">
                                <animate
                                  attributeName="opacity"
                                  begin={begin}
                                  dur="9s"
                                  keyTimes="0;.01;.48;.5;1"
                                  repeatCount="indefinite"
                                  values="0;.12;.12;0;0"
                                />
                                <animateMotion
                                  begin={begin}
                                  calcMode="linear"
                                  dur="9s"
                                  keyPoints="0;1;1"
                                  keyTimes="0;.5;1"
                                  path={path}
                                  repeatCount="indefinite"
                                />
                              </circle>
                              <circle r="2.5" fill="#ff8a4d" opacity="0">
                                <animate
                                  attributeName="opacity"
                                  begin={begin}
                                  dur="9s"
                                  keyTimes="0;.01;.48;.5;1"
                                  repeatCount="indefinite"
                                  values="0;1;1;0;0"
                                />
                                <animateMotion
                                  begin={begin}
                                  calcMode="linear"
                                  dur="9s"
                                  keyPoints="0;1;1"
                                  keyTimes="0;.5;1"
                                  path={path}
                                  repeatCount="indefinite"
                                />
                              </circle>
                            </g>
                          ))}
                        </svg>
                        {[
                          [
                            Mail01Icon,
                            "WhatsApp",
                            translations[lang].flow.newItem,
                            "bg-[#ececea] text-[#555550]",
                          ],
                          [
                            BotIcon,
                            translations[lang].flow.aiTransformation,
                            translations[lang].flow.nodeKinds.ai,
                            "bg-[#fff0e8] text-[#cb501d]",
                          ],
                          [
                            GitBranchIcon,
                            translations[lang].flow.confidenceCheck,
                            translations[lang].flow.confidenceQuestion,
                            "bg-[#eeeaf3] text-[#67607e]",
                          ],
                        ].map(([icon, title, detail, tone], index) => (
                          <div key={String(title)}>
                            <div
                              className="landing-result-card relative z-10 mx-auto flex w-[230px] items-center gap-3 rounded-[17px] border border-white/10 bg-[#2c2c2a] p-3 text-white shadow-[0_1px_2px_rgba(0,0,0,.12),0_8px_22px_rgba(0,0,0,.18)]"
                              style={{ animationDelay: `${index * 55}ms` }}
                            >
                              <span
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${String(tone)}`}
                              >
                                {integrationLogos[String(title)] ? (
                                  <img
                                    src={integrationLogos[String(title)]}
                                    alt=""
                                    className="h-4 w-4 object-contain"
                                  />
                                ) : (
                                  <HugeiconsIcon
                                    icon={icon as typeof Route01Icon}
                                    size={14}
                                  />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[11px] font-semibold">
                                  {String(title)}
                                </span>
                                <span className="mt-0.5 block truncate text-[9px] text-white/45">
                                  {String(detail)}
                                </span>
                              </span>
                            </div>
                            {index < 2 && (
                              <span className="relative mx-auto block h-4 w-px border-l border-dashed border-[#aaa9a4]" />
                            )}
                          </div>
                        ))}

                        <div className="relative h-12 w-full text-[7px] text-white/40">
                          <svg
                            aria-hidden="true"
                            className="landing-route-branch absolute inset-0 h-full w-full overflow-visible"
                            viewBox="0 0 440 48"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M220 0 V12 H106 V48"
                              fill="none"
                              stroke="#aaa9a4"
                              strokeDasharray="4 4"
                            />
                            <path
                              d="M220 12 H334 V48"
                              fill="none"
                              stroke="#aaa9a4"
                              strokeDasharray="4 4"
                            />
                          </svg>
                          <span className="absolute left-2 top-3 -translate-y-1/2 bg-[#20201f] px-1">
                            {translations[lang].flow.reviewEdge}
                          </span>
                          <span className="absolute right-2 top-3 -translate-y-1/2 bg-[#20201f] px-1">
                            {translations[lang].flow.confidenceEdge}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            [
                              UserCheck01Icon,
                              translations[lang].flow.humanReview,
                              translations[lang].flow.resolveUncertainty,
                              "bg-[#e9eef2] text-[#627280]",
                            ],
                            [
                              Database01Icon,
                              translations[lang].flow.updateDestination(
                                "Salesforce",
                              ),
                              translations[lang].flow.completeAction,
                              "bg-[#ececea] text-[#555550]",
                            ],
                          ].map(([icon, title, detail, tone], index) => {
                            const logo = findIntegration(String(title), "");
                            return (
                            <div
                              key={String(title)}
                              className="landing-result-card relative z-10 flex min-w-0 items-center gap-2.5 rounded-[17px] border border-white/10 bg-[#2c2c2a] p-3 text-white shadow-[0_1px_2px_rgba(0,0,0,.12),0_8px_22px_rgba(0,0,0,.18)]"
                              style={{
                                animationDelay: `${(index + 3) * 55}ms`,
                              }}
                            >
                              <span
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${String(tone)}`}
                              >
                                {logo ? (
                                  <img
                                    src={integrationLogos[logo]}
                                    alt=""
                                    className="h-4 w-4 object-contain"
                                  />
                                ) : (
                                  <HugeiconsIcon
                                    icon={icon as typeof Route01Icon}
                                    size={14}
                                  />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[10px] font-semibold">
                                  {String(title)}
                                </span>
                                <span className="mt-0.5 block truncate text-[8px] text-white/45">
                                  {String(detail)}
                                </span>
                              </span>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeJourney === 3 && (
                    <div className="flex h-[410px] flex-col justify-center">
                      <div className="flex items-center gap-3 text-[#75cb8a]">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
                        <span className="text-[11px] font-semibold">
                          {translations[lang].flow.routeComplete}
                        </span>
                      </div>
                      <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {[
                          ["24", translations[lang].routes.runsThisWeek],
                          ["96%", translations[lang].routes.success],
                          ["8h", translations[lang].routes.savedPerWeek],
                        ].map(([value, label]) => (
                          <div
                            key={String(label)}
                            className="rounded-[18px] border border-white/10 bg-white/[.055] p-5"
                          >
                            <p className="text-[28px] font-semibold tracking-[-.04em]">
                              {value}
                            </p>
                            <p className="mt-2 text-[9px] text-white/40">
                              {String(label)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col border-t border-black/[.09]">
                {copy.steps.map(([title, description], index) => (
                  <button
                    key={title}
                    type="button"
                    onMouseEnter={() => setActiveJourney(index)}
                    onFocus={() => setActiveJourney(index)}
                    onClick={() => setActiveJourney(index)}
                    className="pressable group flex flex-1 gap-5 border-b border-black/[.09] py-5 text-left sm:px-3"
                  >
                    <span
                      className={`mt-1 text-[10px] font-semibold ${activeJourney === index ? "text-[#df6027]" : "text-[#aaa9a4]"}`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[18px] font-semibold tracking-[-.03em] ${activeJourney === index ? "text-[#20201f]" : "text-[#999994]"}`}
                      >
                        {title}
                      </span>
                      <span
                        className={`mt-2 block max-w-md text-[11px] leading-5 ${activeJourney === index ? "text-[#6f6f6a]" : "text-[#aaa9a4]"}`}
                      >
                        {description}
                      </span>
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={15}
                      className={`mt-1 ${activeJourney === index ? "text-[#20201f]" : "text-[#c3c3bf]"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            id="contact"
            className="scroll-mt-6 border-t border-black/[.08] py-24 sm:py-32"
          >
            <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
              <div>
                <h2 className="max-w-[560px] text-[clamp(2.8rem,4.5vw,5rem)] font-semibold leading-[.94] tracking-[-.065em]">
                  {copy.contactTitle}
                </h2>
                <p className="mt-6 max-w-md text-[14px] leading-6 text-[#6f6f6a]">
                  {copy.contactBody}
                </p>
              </div>
              <form
                onSubmit={submitLead}
                className="grid gap-4 rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_18px_55px_rgba(0,0,0,.055)] sm:grid-cols-2 sm:p-7"
              >
                <TextField
                  label={copy.fields.company}
                  value={lead.name}
                  onChange={(value) => updateLead("name", value)}
                  placeholder="Amazonik"
                />
                <label className="block">
                  <span className="mb-2 block text-[12px] font-medium">
                    {copy.fields.email}
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      clearInquiryError();
                      setEmail(event.target.value);
                    }}
                    placeholder="you@company.com"
                    className="h-12 w-full rounded-[14px] bg-[#f7f7f5] px-4 text-[13px] outline-none ring-[#ff7a35] placeholder:text-[#aaa9a5] focus:ring-2"
                  />
                </label>
                <TextField
                  label={copy.fields.size}
                  value={lead.size}
                  onChange={(value) => updateLead("size", value)}
                  select
                  selectOptions={translations[lang].onboarding.teamSizes}
                />
                <TextField
                  wide
                  label={copy.fields.does}
                  value={lead.description}
                  onChange={(value) => updateLead("description", value)}
                  placeholder={
                    translations[lang].onboarding.companyDescriptionPlaceholder
                  }
                />
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[12px] font-medium">
                    {copy.fields.bottlenecks}
                  </span>
                  <span className="mb-2 block text-[10px] text-[#8a8a85]">
                    {copy.optional}
                  </span>
                  <textarea
                    value={lead.bottlenecks}
                    onChange={(event) =>
                      updateLead("bottlenecks", event.target.value)
                    }
                    placeholder={
                      translations[lang].onboarding.bottlenecksPlaceholder
                    }
                    rows={3}
                    className="w-full resize-none rounded-[14px] bg-[#f7f7f5] px-4 py-3 text-[13px] leading-5 outline-none ring-[#ff7a35] placeholder:text-[#aaa9a5] focus:ring-2"
                  />
                </label>
                <div className="flex flex-col items-end gap-3 sm:col-span-2">
                  {inquiryState === "success" ? (
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#20201f]">
                      <HugeiconsIcon icon={CheckIcon} size={16} />
                      {copy.submitSuccess}
                    </span>
                  ) : (
                    <>
                      {inquiryState === "error" ? (
                        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#df6027]">
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
                          {copy.submitError}
                        </span>
                      ) : null}
                      <Button
                        type="submit"
                        disabled={
                          inquiryState === "submitting" ||
                          !lead.name.trim() ||
                          !lead.description.trim() ||
                          !email.trim()
                        }
                      >
                        {copy.submit}
                        {inquiryState === "submitting" ? (
                          <LoadingOrb state="solving" theme="dark" />
                        ) : (
                          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </section>

          <section className="rounded-[28px] bg-[#20201f] px-6 py-16 text-white sm:rounded-[36px] sm:px-12 sm:py-20 lg:px-20">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
              <h2 className="max-w-[760px] text-[clamp(2.6rem,4.5vw,5rem)] font-semibold leading-[.94] tracking-[-.065em]">
                {copy.exampleTitle}
              </h2>
              <div>
                <p className="max-w-md text-[13px] leading-6 text-white/60">
                  {copy.exampleBody}
                </p>
                <div className="mt-8 flex flex-col items-start gap-5">
                  <img
                    src={amazonikLogo}
                    alt="Amazonik"
                    className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28"
                  />
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={explore}
                      className="pressable inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-medium text-[#20201f]"
                    >
                      {copy.exampleButton}
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                    <span className="text-[12px] text-white/45">or</span>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pressable inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-[13px] font-medium text-white"
                    >
                      <GitHubMark className="h-4 w-4" />
                      {copy.deploy}
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 border-t border-black/[.08] py-10 text-[10px] text-[#8a8a85] sm:flex-row sm:items-center sm:justify-between">
        <span>{copy.note}</span>
        <span>
          Barcelona · © Heighliner 2026 ·{" "}
          <a
            href="https://janjs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable hover:text-[#555550]"
          >
            janjs.dev
          </a>
        </span>
      </footer>
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  secondary,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`pressable inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${secondary ? "bg-black/[.055] text-[#292927] hover:bg-black/[.08]" : "bg-[#20201f] text-white hover:bg-black"} ${className}`}
    >
      {children}
    </button>
  );
}

function LanguageSwitcher() {
  const { lang, setLang } = useLocale();

  return (
    <details className="group relative">
      <summary
        aria-label="Language"
        className="pressable cursor-pointer list-none text-[11px] font-medium text-[#8a8a85] hover:text-[#292927] [&::-webkit-details-marker]:hidden"
      >
        {lang.toUpperCase()}
      </summary>
      <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[9.5rem] overflow-hidden rounded-xl border border-black/[.06] bg-white/95 py-1 shadow-[0_8px_24px_rgba(0,0,0,.08)] backdrop-blur-xl">
        {(Object.keys(languageLabels) as Lang[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={(event) => {
              setLang(option);
              const details = event.currentTarget.closest("details");
              if (details) details.open = false;
            }}
            className={`pressable block w-full px-3 py-2 text-left text-[11px] ${lang === option ? "font-medium text-[#20201f]" : "text-[#777772] hover:text-[#20201f]"}`}
          >
            {languageLabels[option]}
          </button>
        ))}
      </div>
    </details>
  );
}

function SystemMark({ name, logo }: { name: string; logo?: string }) {
  const src = integrationLogos[name] ?? logo;
  const [loadedSrc, setLoadedSrc] = useState("");
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]">
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={`h-5 w-5 object-contain ${loadedSrc === src ? "" : "invisible"}`}
          onLoad={() => setLoadedSrc(src)}
        />
      ) : null}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  wide,
  select,
  selectOptions,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
  select?: boolean;
  selectOptions?: string[];
}) {
  const fieldClassName =
    "h-12 w-full rounded-[14px] bg-[#f7f7f5] px-4 text-[13px] outline-none ring-[#ff7a35] placeholder:text-[#aaa9a5] focus:ring-2";
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block text-[12px] font-medium">{label}</span>
      {select ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClassName}
        >
          {(selectOptions || []).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
    </label>
  );
}

type SidebarAccount = {
  name: string;
  email: string;
  avatar?: string;
  onAvatarChange: (file: File) => void;
  onReset: () => void;
};

function UserAccount({ account }: { account: SidebarAccount }) {
  const details = useRef<HTMLDetailsElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        !details.current?.contains(
          event.target instanceof Element ? event.target : null,
        )
      )
        details.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <details ref={details} className="group relative">
      <summary className="pressable flex cursor-pointer list-none items-center gap-3 rounded-[13px] px-3 py-2.5 hover:bg-black/[.04] [&::-webkit-details-marker]:hidden">
        {account.avatar ? (
          <img
            src={account.avatar}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ececea] text-[12px] font-semibold text-[#555550]">
            {account.name.trim().charAt(0).toUpperCase() || "U"}
          </span>
        )}
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[11px] font-medium">
            {account.name}
          </span>
          <span className="mt-0.5 block truncate text-[9px] text-[#999994]">
            {account.email}
          </span>
        </span>
        <HugeiconsIcon
          icon={MoreVerticalIcon}
          size={14}
          className="text-[#999994]"
        />
      </summary>
      <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-full rounded-[16px] border border-black/[.06] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,.12)]">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) account.onAvatarChange(file);
            event.target.value = "";
            details.current?.removeAttribute("open");
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="pressable flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[11px] font-medium hover:bg-black/[.04]"
        >
          <HugeiconsIcon icon={Camera01Icon} size={14} />
          Change profile picture
        </button>
        <button
          type="button"
          onClick={() => {
            details.current?.removeAttribute("open");
            account.onReset();
          }}
          className="pressable flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[11px] font-medium text-red-600 hover:bg-red-50"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Reset onboarding
        </button>
      </div>
    </details>
  );
}

function Sidebar({
  view,
  setView,
  routes,
  selected,
  selectRoute,
  showRoutes,
  opportunities,
  selectOpportunity,
  reset,
  contact,
  isExample,
  account,
}: {
  view: View;
  setView: (v: View) => void;
  routes: RouteData[];
  selected?: string;
  selectRoute: (id: string) => void;
  showRoutes: () => void;
  opportunities: Opportunity[];
  selectOpportunity: (id: string) => void;
  reset: () => void;
  contact: () => void;
  isExample?: boolean;
  account?: SidebarAccount;
}) {
  const { copy } = useLocale();
  const [routesOpen, setRoutesOpen] = useState(true);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col bg-white/65 px-3 py-5 backdrop-blur-2xl">
      <div className="px-3">
        <Logo onClick={reset} />
      </div>
      <nav className="mt-8 space-y-3">
        <div>
          <div
            className={`flex h-10 items-center rounded-[11px] ${view === "Routes" ? "bg-black/[.065]" : "hover:bg-black/[.035]"}`}
          >
            <button
              onClick={() => {
                showRoutes();
                setRoutesOpen(true);
              }}
              className={`pressable flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[11px] px-3 text-[13px] transition ${view === "Routes" ? "font-medium" : "text-[#70706b]"}`}
            >
              <HugeiconsIcon icon={Route01Icon} size={16} strokeWidth={1.7} />
              <span className="truncate">{copy.nav.routes}</span>
            </button>
            <button
              type="button"
              aria-expanded={routesOpen}
              aria-label={copy.nav.routesHeading}
              onClick={() => setRoutesOpen((open) => !open)}
              className="pressable mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#999994] hover:bg-black/[.06] hover:text-[#555550]"
            >
              <span className={`transition ${routesOpen ? "rotate-90" : ""}`}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
              </span>
            </button>
          </div>
          {routesOpen && (
            <div className="mt-1 space-y-1 pl-3">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => selectRoute(route.id)}
                  className={`pressable flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left ${selected === route.id && view === "Routes" ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8c7c1]" />
                  <span className="truncate text-[11px] font-medium">
                    {route.title}
                  </span>
                </button>
              ))}
              {routes.length === 0 && (
                <p className="px-3 py-2 text-[10px] leading-4 text-[#999994]">
                  {copy.nav.routesEmpty}
                </p>
              )}
            </div>
          )}
        </div>
        <div>
          <div
            className={`flex h-10 items-center rounded-[11px] ${view === "Opportunities" ? "bg-black/[.065]" : "hover:bg-black/[.035]"}`}
          >
            <button
              onClick={() => setView("Opportunities")}
              className={`pressable flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[11px] px-3 text-[13px] transition ${view === "Opportunities" ? "font-medium" : "text-[#70706b]"}`}
            >
              <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={1.7} />
              <span className="flex min-w-0 items-baseline gap-3">
                <span className="truncate">{copy.nav.opportunities}</span>
                {opportunities.length > 0 && (
                  <span className="text-[11px] text-[#999994]">
                    {opportunities.length}
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              aria-expanded={opportunitiesOpen}
              aria-label={copy.nav.opportunitiesHeading}
              onClick={() => setOpportunitiesOpen((open) => !open)}
              className="pressable mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#999994] hover:bg-black/[.06] hover:text-[#555550]"
            >
              <span
                className={`transition ${opportunitiesOpen ? "rotate-90" : ""}`}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
              </span>
            </button>
          </div>
          {opportunitiesOpen && (
            <div className="mt-1 space-y-1 pl-3">
              {opportunities.map((opportunity) => (
                <button
                  key={opportunity.id}
                  onClick={() => selectOpportunity(opportunity.id)}
                  className="pressable flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left hover:bg-white/60"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8c7c1]" />
                  <span className="truncate text-[11px] font-medium">
                    {opportunity.title}
                  </span>
                </button>
              ))}
              {opportunities.length === 0 && (
                <p className="px-3 py-2 text-[10px] leading-4 text-[#999994]">
                  {copy.nav.opportunitiesEmpty}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setView("Sources")}
          className={`pressable flex h-10 w-full items-center gap-3 rounded-[11px] px-3 text-[13px] transition ${view === "Sources" ? "bg-black/[.065] font-medium" : "text-[#70706b] hover:bg-black/[.035]"}`}
        >
          <HugeiconsIcon icon={Database01Icon} size={16} strokeWidth={1.7} />
          {copy.nav.sources}
        </button>
      </nav>
      {(account || isExample) && (
        <div className="mt-auto px-1">
          {account ? (
            <UserAccount account={account} />
          ) : (
            <WorkspaceAccount
              name="Amazonik S.L."
              subtitle="amazonik.es"
              logoSrc={amazonikLogo}
              logoAlt="Amazonik logo"
              onContact={contact}
            />
          )}
        </div>
      )}
    </aside>
  );
}

function ShellHeader({
  title,
  subtitle,
  action,
  back,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: () => void;
  backLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[82px] w-full min-w-0 items-center gap-3 bg-[#f7f7f5]/82 px-5 backdrop-blur-xl">
      {back && (
        <button
          onClick={back}
          aria-label={backLabel}
          className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#555550] hover:bg-black/[.08]"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
        </button>
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <h1 className="truncate text-[19px] font-semibold tracking-[-.035em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 truncate text-[11px] text-[#898984]">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </header>
  );
}

function OpportunityList({
  opportunities,
  creating,
  error,
  create,
  remove,
  addSource,
  createManual,
}: {
  opportunities: Opportunity[];
  creating: string | null;
  error?: string;
  create: (o: Opportunity) => void;
  remove: (o: Opportunity) => Promise<void>;
  addSource: () => void;
  createManual: (title: string, description: string) => Promise<void>;
}) {
  const { copy } = useLocale();
  const [tab, setTab] = useState<"new" | "used">("new");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState("");
  const visibleOpportunities = opportunities.filter((opportunity) =>
    tab === "used"
      ? opportunity.status === "converted"
      : opportunity.status !== "converted",
  );
  const action = (
    <Button onClick={() => setManualOpen(true)}>
      <HugeiconsIcon icon={Add01Icon} size={14} />
      {copy.opportunities.newOpportunity}
    </Button>
  );
  const manualDialog = manualOpen && (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !manualBusy)
          setManualOpen(false);
      }}
    >
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-opportunity-title"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,.2)]"
        onSubmit={async (event) => {
          event.preventDefault();
          setManualBusy(true);
          setManualError("");
          try {
            await createManual(title.trim(), description.trim());
            setTitle("");
            setDescription("");
            setManualOpen(false);
          } catch (error) {
            setManualError(
              error instanceof Error
                ? error.message
                : "Could not create the opportunity.",
            );
          } finally {
            setManualBusy(false);
          }
        }}
      >
        <h2
          id="new-opportunity-title"
          className="text-[21px] font-semibold tracking-[-.035em]"
        >
          {copy.opportunities.newOpportunityTitle}
        </h2>
        <label className="mt-6 block">
          <span className="mb-2 block text-[12px] font-medium">
            {copy.opportunities.titleLabel}
          </span>
          <input
            autoFocus
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-12 w-full rounded-[14px] bg-[#f7f7f5] px-4 text-[13px] outline-none ring-[#ff7a35] focus:ring-2"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-[12px] font-medium">
            {copy.opportunities.descriptionLabel}
          </span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-none rounded-[14px] bg-[#f7f7f5] px-4 py-3 text-[13px] leading-5 outline-none ring-[#ff7a35] focus:ring-2"
          />
        </label>
        {manualError && (
          <p className="mt-3 text-[11px] text-red-600">{manualError}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            secondary
            disabled={manualBusy}
            onClick={() => setManualOpen(false)}
          >
            {copy.opportunities.cancel}
          </Button>
          <Button
            type="submit"
            disabled={manualBusy || !title.trim() || !description.trim()}
          >
            {manualBusy && <LoadingOrb state="composing" theme="dark" />}
            {copy.opportunities.createOpportunity}
          </Button>
        </div>
      </motion.form>
    </div>
  );
  if (!opportunities.length)
    return (
      <div className="min-h-screen">
        <ShellHeader title={copy.opportunities.title} action={action} />
        <div className="grid h-[calc(100vh-82px)] place-items-center">
          <div className="max-w-md text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-white shadow-sm">
              <HugeiconsIcon icon={Database01Icon} size={22} />
            </span>
            <h2 className="mt-6 text-[25px] font-semibold tracking-[-.04em]">
              {copy.opportunities.emptyTitle}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-[#81817c]">
              {copy.opportunities.emptyDescription}
            </p>
            <Button onClick={addSource} className="mt-6">
              <HugeiconsIcon icon={Add01Icon} size={14} />
              {copy.opportunities.addSource}
            </Button>
          </div>
        </div>
        {manualDialog}
      </div>
    );
  return (
    <div>
      <ShellHeader
        title={copy.opportunities.title}
        subtitle={copy.opportunities.subtitle}
        action={action}
      />
      <div className="mx-auto max-w-[1120px] px-8 py-10 lg:px-10">
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-[14px] bg-red-50 px-4 py-3 text-[11px] text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mb-10">
          <h2 className="text-[38px] font-semibold tracking-[-.05em]">
            {tab === "new"
              ? copy.opportunities.heading(visibleOpportunities.length)
              : copy.opportunities.inUseHeading(visibleOpportunities.length)}
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#777772]">
            {copy.opportunities.description}
          </p>
        </div>
        <div
          role="tablist"
          aria-label={copy.opportunities.title}
          className="mb-4 inline-flex rounded-[12px] bg-black/[.055] p-1"
        >
          {(["new", "used"] as const).map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={`pressable min-w-[88px] rounded-[9px] px-4 py-2 text-[11px] font-semibold transition ${tab === item ? "bg-white text-[#292927] shadow-sm" : "text-[#858580] hover:text-[#555550]"}`}
            >
              {item === "new"
                ? copy.opportunities.newTab
                : copy.opportunities.usedTab}
            </button>
          ))}
        </div>
        {!visibleOpportunities.length ? (
          <div className="rounded-[22px] bg-white px-6 py-16 text-center text-[13px] text-[#81817c] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            {tab === "new"
              ? copy.opportunities.newEmpty
              : copy.opportunities.usedEmpty}
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              {visibleOpportunities.map((o, i) => (
                <motion.article
                  key={o.id}
                  id={`opportunity-${o.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.035 }}
                  className="group scroll-m-6 rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.03),0_10px_30px_rgba(0,0,0,.025)]"
                >
                  <div className="flex items-stretch gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-[-.02em]">
                          {o.title}
                        </h3>
                        {i === 0 && (
                          <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[9px] font-semibold text-[#c84f1b]">
                            {copy.opportunities.recommended}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] leading-5 text-[#777772]">
                        {o.description}
                      </p>
                      <p className="mt-3 text-[10px] text-[#999994]">
                        <span className="font-medium text-[#686863]">
                          {copy.opportunities.evidence}
                        </span>{" "}
                        {o.evidence}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="rounded-full bg-black/[.045] px-2.5 py-1">
                          {copy.opportunities.impact[o.impact]}
                        </span>
                        <span className="rounded-full bg-black/[.045] px-2.5 py-1">
                          {copy.opportunities.effort[o.effort]}
                        </span>
                        <span className="text-[#999994]">
                          {o.confidence}% {copy.opportunities.confidenceLabel}
                        </span>
                        <span className="text-[#999994]">
                          {o.systems.join(" · ")}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end self-stretch text-right">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          aria-label={copy.opportunities.deleteOpportunity(
                            o.title,
                          )}
                          disabled={deleting === o.id}
                          onClick={() => {
                            setDeleting(o.id);
                            void remove(o).finally(() => setDeleting(null));
                          }}
                          className="pressable grid h-8 w-8 place-items-center rounded-full text-[#999994] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          {deleting === o.id ? (
                            <LoadingOrb />
                          ) : (
                            <HugeiconsIcon icon={Delete02Icon} size={13} />
                          )}
                        </button>
                        <div>
                          <div className="text-[22px] font-semibold tracking-[-.045em]">
                            {o.hours}h
                          </div>
                          <div className="text-[9px] text-[#999994]">
                            {copy.opportunities.savedPerWeek}
                          </div>
                        </div>
                      </div>
                      {o.status !== "converted" && (
                        <Button
                          disabled={creating === o.id || deleting === o.id}
                          onClick={() => create(o)}
                          className="mt-auto h-9 px-3.5 text-[11px]"
                        >
                          {creating === o.id ? (
                            <LoadingOrb state="solving" theme="dark" />
                          ) : (
                            <HugeiconsIcon icon={Add01Icon} size={13} />
                          )}{" "}
                          {copy.opportunities.createRoute}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
            <section className="sticky top-[102px] rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.03),0_10px_30px_rgba(0,0,0,.025)]">
              <div className="flex items-center justify-between px-5 pt-5">
                <h3 className="text-[12px] font-semibold tracking-[-.02em]">
                  {copy.opportunities.mapTitle}
                </h3>
                <span className="flex items-center gap-1.5 text-[8px] text-[#999994]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e45e20]" />
                  {copy.opportunities.recommended}
                </span>
              </div>
              <div className="relative mx-5 mb-5 mt-4 aspect-square rounded-[18px] bg-black/[.025]">
                <div className="absolute inset-x-4 top-1/2 h-px bg-black/[.065]" />
                <div className="absolute inset-y-4 left-1/2 w-px bg-black/[.065]" />
                <span className="absolute left-3 top-3 text-[8px] font-medium text-[#8c8c87]">
                  {copy.opportunities.highAxis} {copy.opportunities.impactAxis}
                </span>
                <span className="absolute bottom-3 left-3 text-[8px] font-medium text-[#aaa9a4]">
                  {copy.opportunities.lowAxis} {copy.opportunities.impactAxis}
                </span>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-medium text-[#aaa9a4]">
                  {copy.opportunities.lowAxis} {copy.opportunities.effortAxis}
                </span>
                <span className="absolute bottom-3 right-3 text-[8px] font-medium text-[#aaa9a4]">
                  {copy.opportunities.highAxis} {copy.opportunities.effortAxis}
                </span>
                {visibleOpportunities.map((opportunity, index) => {
                  const x =
                    (opportunity.effort === "Low" ? 27 : 67) +
                    ((index % 3) - 1) * 7;
                  const y =
                    (opportunity.impact === "High" ? 27 : 66) +
                    ((Math.floor(index / 3) % 3) - 1) * 5;
                  return (
                    <button
                      key={opportunity.id}
                      onClick={() =>
                        document
                          .getElementById(`opportunity-${opportunity.id}`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          })
                      }
                      aria-label={opportunity.title}
                      className={`group absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,.8)] outline-none transition-transform hover:scale-125 focus-visible:scale-125 ${index === 0 ? "bg-[#e45e20]" : "bg-[#4f4f4a]"}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[180px] -translate-x-1/2 translate-y-1 scale-95 rounded-[10px] bg-[#20201e] px-2.5 py-1.5 text-[9px] font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100">
                        {opportunity.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
      {manualDialog}
    </div>
  );
}

function FlowNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const Icon =
    data.action === "read_files"
      ? Upload01Icon
      : data.action === "create_file"
        ? File01Icon
        : {
            system: BoxesIcon,
            ai: BotIcon,
            knowledge: Folder01Icon,
            logic: GitBranchIcon,
            human: UserCheck01Icon,
          }[data.kind];
  const logo = data.integration && integrationLogos[data.integration];
  const tones = {
    system: "bg-[#ececea]",
    ai: "bg-[#fff0e8] text-[#cb501d]",
    knowledge: "bg-[#eaf0e7]",
    logic: "bg-[#eeeaf3]",
    human: "bg-[#e9eef2]",
  };
  return (
    <div
      className={`min-w-[188px] rounded-[17px] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_22px_rgba(0,0,0,.045)] transition ${selected ? "ring-2 ring-[#ff7a35]" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-3">
        <span
          className={`grid h-8 w-8 place-items-center rounded-[10px] ${tones[data.kind]}`}
        >
          {logo ? (
            <img src={logo} alt="" className="h-4 w-4 object-contain" />
          ) : (
            <HugeiconsIcon icon={Icon} size={14} />
          )}
        </span>
        <span>
          <span className="block text-[11px] font-semibold">{data.label}</span>
          <span className="mt-0.5 block text-[9px] text-[#92928d]">
            {data.detail}
          </span>
        </span>
        {data.status === "done" && (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={15}
            className="ml-auto text-[#57a26b]"
          />
        )}
        {data.status === "running" && (
          <LoadingOrb state="solving" className="ml-auto" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function routeStepAlias(
  step: Pick<RouteStep, "label" | "action">,
  systems: string[],
) {
  const raw = step.label.trim();
  if (!raw.includes("_") && raw !== step.action) return raw;
  if (step.action === "read_sources" || raw.startsWith("read_sources"))
    return systems.includes("Gmail") ? "Read emails" : "Read source data";
  if (step.action === "read_files" || raw.startsWith("read_files"))
    return "Input files";
  if (step.action === "create_file" || raw.startsWith("create_file"))
    return "Output file";

  const words = raw
    .replace(/^ai_transform_?/, "")
    .replaceAll("_", " ")
    .trim();
  if (!words) return "Transform data";
  return words[0].toUpperCase() + words.slice(1);
}

function findIntegration(label: string, detail: string) {
  if (integrationLogos[label]) return label;
  return Object.keys(integrationLogos)
    .sort((a, b) => b.length - a.length)
    .find((name) => `${label} ${detail}`.includes(name));
}

function makeFlow(
  route: RouteData,
  lang: Lang,
): {
  nodes: Node<FlowData>[];
  edges: Edge[];
} {
  const flowCopy = translations[lang].flow;
  const connected = route.systems.filter((name) => integrationLogos[name]);
  const destination =
    connected.at(-1) || route.systems.at(-1) || "Business system";
  const sources = connected.filter((name) => name !== destination).slice(0, 2);
  const inputs = sources.length ? sources : [route.systems[0] || "Gmail"];
  const defaultSteps: [
    string,
    string,
    FlowData["kind"],
    string?,
    RouteStep["action"]?,
  ][] = [
    ...inputs.map(
      (name): [string, string, FlowData["kind"], string?] => [
        name,
        flowCopy.newItem,
        "system",
        name,
      ],
    ),
    [flowCopy.collectContext, flowCopy.readSourceData, "knowledge"],
    [
      route.title.replace(flowCopy.routePrefixes, ""),
      flowCopy.aiTransformation,
      "ai",
    ],
    [flowCopy.confidenceCheck, flowCopy.confidenceQuestion, "logic"],
    [flowCopy.humanReview, flowCopy.resolveUncertainty, "human"],
    [
      flowCopy.updateDestination(destination),
      flowCopy.completeAction,
      "system",
      destination,
    ],
    [
      flowCopy.routeComplete,
      flowCopy.destinationReached,
      "system",
      destination,
    ],
  ];
  const labels = route.steps?.length
    ? route.steps.map(
        (
          step,
        ): [
          string,
          string,
          FlowData["kind"],
          string | undefined,
          RouteStep["action"],
        ] => [
          routeStepAlias(step, route.systems),
          step.detail,
          step.kind,
          findIntegration(step.label, step.detail) ||
            (step.action === "read_sources"
              ? route.systems.find((system) => integrationLogos[system])
              : undefined),
          step.action,
        ],
      )
    : defaultSteps;
  if (route.steps?.length) {
    const nodes: Node<FlowData>[] = labels.map((item, index) => ({
      id: String(index + 1),
      type: "flow",
      position: { x: 270, y: 20 + index * 125 },
      data: {
        label: item[0],
        detail: item[1],
        kind: item[2],
        integration: item[3],
        action: item[4],
      },
    }));
    return {
      nodes,
      edges: nodes.slice(1).map((node, index) => ({
        id: `edited-${index}`,
        source: String(index + 1),
        target: node.id,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 11,
          height: 11,
          color: "#aaa9a4",
        },
        style: { stroke: "#aaa9a4", strokeWidth: 1.15 },
      })),
    };
  }
  const branched = inputs.length > 1;
  const positions = branched
    ? [
        [55, 20],
        [485, 20],
        [270, 145],
        [270, 270],
        [270, 395],
        [55, 535],
        [485, 535],
        [270, 680],
      ]
    : [
        [270, 20],
        [270, 145],
        [270, 270],
        [270, 395],
        [55, 535],
        [485, 535],
        [270, 680],
      ];
  const nodes: Node<FlowData>[] = labels.map((l, i) => ({
    id: String(i + 1),
    type: "flow",
    position: { x: positions[i][0], y: positions[i][1] },
    data: { label: l[0], detail: l[1], kind: l[2], integration: l[3] },
  }));
  const mk = (
    id: string,
    source: string,
    target: string,
    label?: string,
  ): Edge => ({
    id,
    source,
    target,
    label,
    type: "smoothstep",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 11,
      height: 11,
      color: "#aaa9a4",
    },
    style: { stroke: "#aaa9a4", strokeWidth: 1.15 },
    labelStyle: { fontSize: 9, fill: "#888883" },
    labelBgStyle: { fill: "#f7f7f5" },
  });
  const collect = String(inputs.length + 1);
  const ai = String(inputs.length + 2);
  const conf = String(inputs.length + 3);
  const human = String(inputs.length + 4);
  const update = String(inputs.length + 5);
  const complete = String(inputs.length + 6);
  return {
    nodes,
    edges: [
      ...inputs.map((_, index) =>
        mk(`in-${index}`, String(index + 1), collect),
      ),
      mk("b", collect, ai),
      mk("c", ai, conf),
      mk("d", conf, human, flowCopy.reviewEdge),
      mk("e", conf, update, flowCopy.confidenceEdge),
      mk("f", human, complete),
      mk("g", update, complete),
    ],
  };
}

function Routes({
  routes,
  selectedId,
  setSelected,
  updateRoute,
  removeRoute,
  showOpportunities,
}: {
  routes: RouteData[];
  selectedId?: string;
  setSelected: (id?: string) => void;
  updateRoute: (route: RouteData) => void;
  removeRoute: (route: RouteData) => Promise<boolean>;
  showOpportunities: () => void;
}) {
  const { copy, lang } = useLocale();
  const selected = routes.find((r) => r.id === selectedId);
  const [step, setStep] = useState(0);
  const [inspected, setInspected] = useState<Node<FlowData> | null>(null);
  const [review, setReview] = useState(false);
  const [runningServer, setRunningServer] = useState(false);
  const [generatingRoute, setGeneratingRoute] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState(false);
  const [confirmingDeleteRouteId, setConfirmingDeleteRouteId] = useState<
    string | null
  >(null);
  const [runError, setRunError] = useState("");
  const [pendingExecution, setPendingExecution] = useState<RouteExecution>();
  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyWidth, setHistoryWidth] = useState(360);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>();
  const [sideTab, setSideTab] = useState<"chat" | "history">("history");
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [executions, setExecutions] = useState<RouteExecution[]>([]);
  const selectedExecution = executions.find(
    (execution) => execution.id === selectedExecutionId,
  );
  const executionCopy = executionCopyByLang[lang];
  const flow = useMemo(
    () => (selected ? makeFlow(selected, lang) : null),
    [selected, lang],
  );
  const completeStep = (flow?.nodes.length || 0) + 1;
  const chatCopy = chatCopyByLang[lang];
  useEffect(() => {
    setStep(0);
    setReview(false);
    setInspected(null);
    setRunError("");
    setPendingExecution(undefined);
    setInputFiles([]);
    setSideTab("history");
    setChatInput("");
    setChatMessages([]);
    setSelectedExecutionId(undefined);
    setExecutions(selected?.executions || []);
  }, [selected?.id, lang]);
  useEffect(() => {
    const createsFile = selected?.steps?.at(-1)?.action === "create_file";
    const executable =
      selected?.steps?.length &&
      ["read_sources", "read_files"].includes(selected.steps[0].action || "") &&
      selected.steps
        .slice(1, createsFile ? -1 : undefined)
        .every((step) => step.action === "ai_transform");
    if (!selected || executable || !/^\d+$/.test(selected.id)) return;
    let active = true;
    setGeneratingRoute(true);
    void fetch(`/api/routes/${selected.id}/generate`, { method: "POST" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Route generation failed");
        if (active) updateRoute(result.route);
      })
      .catch((error) => {
        if (active)
          setRunError(
            error instanceof Error ? error.message : "Route generation failed",
          );
      })
      .finally(() => {
        if (active) setGeneratingRoute(false);
      });
    return () => {
      active = false;
    };
  }, [selected?.id, selected?.steps?.length]);
  const sendEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || !selected || !flow || chatting) return;
    setChatInput("");
    setChatMessages((current) => [...current, { role: "user", text: message }]);
    setChatting(true);
    try {
      const response = await fetch("/api/routes/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: {
            ...selected,
            steps: flow.nodes.map(({ data }) => ({
              label: data.label,
              detail: data.detail,
              kind: data.kind,
            })),
          },
          message,
          locale: lang,
        }),
      });
      if (!response.ok) throw new Error("Route edit failed");
      const result = await response.json();
      updateRoute(result.route);
      setChatMessages((current) => [
        ...current,
        { role: "assistant", text: result.reply },
      ]);
    } catch {
      setChatMessages((current) => [
        ...current,
        { role: "assistant", text: chatCopy.error },
      ]);
    } finally {
      setChatting(false);
    }
  };
  const runRoute = async () => {
    if (!selected) return;
    const startedAt = Date.now();
    const optimisticExecution: RouteExecution = {
      id: `running-${startedAt}`,
      status: "running",
      output: "",
      durationMs: 0,
      createdAt: new Date(startedAt).toISOString(),
      completedSteps: [],
    };
    setInspected(null);
    setRunError("");
    setPendingExecution(undefined);
    setStep(1);
    if (!/^\d+$/.test(selected.id)) return;
    setSideTab("history");
    setSelectedExecutionId(undefined);
    setExecutions((current) => [optimisticExecution, ...current]);
    setRunningServer(true);
    let returnedExecution: RouteExecution | undefined;
    try {
      const body = new FormData();
      inputFiles.forEach((file) => body.append("files", file));
      const response = await fetch(`/api/routes/${selected.id}/run`, {
        method: "POST",
        body,
      });
      const result = await response.json();
      returnedExecution = result.execution;
      if (!response.ok) throw new Error(result.error || "Route run failed");
      if (returnedExecution)
        setExecutions((current) =>
          current.map((execution) =>
            execution.id === optimisticExecution.id
              ? { ...returnedExecution!, status: "running" }
              : execution,
          ),
        );
      setPendingExecution(result.execution);
      setInputFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      updateRoute({
        ...selected,
        executions: [result.execution, ...(selected.executions || [])],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The route could not run.";
      const failedExecution =
        returnedExecution ||
        ({
          ...optimisticExecution,
          status: "failed",
          output: message,
          durationMs: Date.now() - startedAt,
        } satisfies RouteExecution);
      setStep(0);
      setPendingExecution(undefined);
      setRunError(message);
      setExecutions((current) =>
        current.map((execution) =>
          execution.id === optimisticExecution.id ? failedExecution : execution,
        ),
      );
      updateRoute({
        ...selected,
        executions: [failedExecution, ...(selected.executions || [])],
      });
    } finally {
      setRunningServer(false);
    }
  };
  useEffect(() => {
    if (!step || step >= completeStep || review) return;
    if (runningServer) return;
    if (flow?.nodes[step - 1]?.data.kind === "human") {
      setReview(true);
      return;
    }
    const timer = setTimeout(() => setStep((v) => v + 1), 760);
    return () => clearTimeout(timer);
  }, [step, completeStep, review, flow, runningServer]);
  useEffect(() => {
    if (step !== completeStep || !pendingExecution) return;
    setExecutions((current) =>
      current.some((execution) => execution.id === pendingExecution.id)
        ? current.map((execution) =>
            execution.id === pendingExecution.id ? pendingExecution : execution,
          )
        : [pendingExecution, ...current],
    );
    setSelectedExecutionId(pendingExecution.id);
    setPendingExecution(undefined);
  }, [step, completeStep, pendingExecution]);
  const nodes = useMemo(
    () =>
      flow?.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          detail:
            n.data.action === "read_files" && inputFiles.length
              ? `${inputFiles.length} ${inputFiles.length === 1 ? "file" : "files"} selected`
              : n.data.detail,
          status:
            step > Number(n.id)
              ? ("done" as const)
              : step === Number(n.id)
                ? ("running" as const)
                : ("idle" as const),
        },
      })) || [],
    [flow, step, inputFiles.length],
  );
  const renderDeleteDialog = () => {
    const route = confirmingDeleteRouteId
      ? routes.find((item) => item.id === confirmingDeleteRouteId)
      : undefined;
    if (!route) return null;
    return (
      <div
        className="fixed inset-0 z-[60] grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deletingRoute)
            setConfirmingDeleteRouteId(null);
        }}
      >
        <motion.section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-route-title"
          aria-describedby="delete-route-description"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={spring}
          className="w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,.2)]"
        >
          <h2
            id="delete-route-title"
            className="text-[21px] font-semibold tracking-[-.035em]"
          >
            {copy.routes.deleteRouteTitle(route.title)}
          </h2>
          <p
            id="delete-route-description"
            className="mt-2 text-[12px] leading-5 text-[#777772]"
          >
            {copy.routes.deleteRouteDescription}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              secondary
              disabled={deletingRoute}
              onClick={() => setConfirmingDeleteRouteId(null)}
            >
              {copy.routes.cancelDelete}
            </Button>
            <button
              type="button"
              disabled={deletingRoute}
              onClick={() => {
                setDeletingRoute(true);
                void removeRoute(route)
                  .then((deleted) => {
                    if (deleted) {
                      setConfirmingDeleteRouteId(null);
                      if (selected?.id === route.id) setSelected(undefined);
                    }
                  })
                  .finally(() => setDeletingRoute(false));
              }}
              className="pressable inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deletingRoute && <LoadingOrb theme="dark" />}
              {copy.routes.confirmDelete}
            </button>
          </div>
        </motion.section>
      </div>
    );
  };
  if (!selected && routes.length > 0)
    return (
      <div className="min-h-screen">
        <ShellHeader
          title={copy.routes.overviewTitle}
          subtitle={copy.routes.overviewDescription}
        />
        <div className="mx-auto max-w-[1040px] px-8 py-10 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2">
            {routes.map((route, index) => (
              <motion.article
                key={route.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: index * 0.04 }}
                onClick={() => setSelected(route.id)}
                className="pressable group cursor-pointer rounded-[24px] bg-white p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,.03),0_12px_35px_rgba(0,0,0,.035)] transition-shadow hover:shadow-[0_2px_3px_rgba(0,0,0,.04),0_18px_45px_rgba(0,0,0,.06)]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#fff0e8] text-[#d8551d]">
                    <HugeiconsIcon icon={Route01Icon} size={18} />
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#edf6ef] px-2.5 py-1 text-[9px] font-semibold text-[#3f7b50]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#59a76d]" />
                    {copy.routes.active}
                  </span>
                </div>
                <h3 className="mt-6 text-[17px] font-semibold tracking-[-.03em]">
                  {route.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#7c7c77]">
                  {route.description}
                </p>
                <div className="mt-6 flex items-center">
                  {route.systems.map((system, systemIndex) => (
                    <span
                      key={system}
                      className={`grid h-8 w-8 place-items-center rounded-full bg-[#f0f0ed] text-[#666661] ring-2 ring-white ${systemIndex ? "-ml-1.5" : ""}`}
                      title={system}
                    >
                      {integrationLogos[system] ? (
                        <img
                          src={integrationLogos[system]}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <HugeiconsIcon icon={Folder01Icon} size={14} />
                      )}
                    </span>
                  ))}
                  <span className="ml-3 text-[10px] text-[#92928d]">
                    {route.systems.join(" · ")}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 rounded-[16px] bg-black/[.035] px-4 py-3">
                  <div>
                    <span className="block text-[15px] font-semibold">
                      {recentRuns(route)}
                    </span>
                    <span className="text-[9px] text-[#92928d]">
                      {copy.routes.runsThisWeek}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold">
                      {successRate(route)}
                    </span>
                    <span className="text-[9px] text-[#92928d]">
                      {copy.routes.success}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold">
                      {route.hours}h
                    </span>
                    <span className="text-[9px] text-[#92928d]">
                      {copy.routes.savedPerWeek}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label={copy.routes.deleteRoute(route.title)}
                    disabled={deletingRoute}
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmingDeleteRouteId(route.id);
                    }}
                    className="pressable grid h-8 w-8 place-items-center rounded-full text-[#999994] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={13} />
                  </button>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#686863]">
                    {copy.routes.openRoute}{" "}
                    <HugeiconsIcon icon={ChevronRightIcon} size={12} />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
        {renderDeleteDialog()}
      </div>
    );
  if (!selected)
    return (
      <div className="min-h-screen">
        <ShellHeader title={copy.routes.title} />
        <div className="grid h-[calc(100vh-82px)] place-items-center">
          <div className="max-w-md text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-white shadow-sm">
              <HugeiconsIcon icon={Route01Icon} size={22} />
            </span>
            <h2 className="mt-6 text-[25px] font-semibold tracking-[-.04em]">
              {copy.routes.emptyTitle}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-[#81817c]">
              {copy.routes.emptyDescription}
            </p>
            <Button onClick={showOpportunities} className="mt-6">
              {copy.routes.viewOpportunities}
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{ gridTemplateColumns: `minmax(0, 1fr) 6px ${historyWidth}px` }}
    >
      <div className="min-w-0">
        <ShellHeader
          title={selected.title}
          subtitle={`${selected.systems.join(" → ")} · ${selected.hours} ${copy.routes.hoursSavedEachWeek}`}
          back={() => setSelected(undefined)}
          backLabel={copy.routes.backToRoutes}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={copy.routes.deleteRoute(selected.title)}
                disabled={deletingRoute || generatingRoute || runningServer}
                onClick={() => setConfirmingDeleteRouteId(selected.id)}
                className="pressable grid h-10 w-10 place-items-center rounded-full bg-black/[.055] text-[#777772] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                {deletingRoute ? (
                  <LoadingOrb />
                ) : (
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                )}
              </button>
              <Button
                onClick={() => void runRoute()}
                className="whitespace-nowrap"
                disabled={
                  deletingRoute ||
                  generatingRoute ||
                  runningServer ||
                  (step > 0 && step < completeStep)
                }
              >
                {generatingRoute ||
                runningServer ||
                (step > 0 && step < completeStep) ? (
                  <>
                    <LoadingOrb
                      state={generatingRoute ? "weaving" : "solving"}
                      theme="dark"
                    />{" "}
                    {copy.routes.running}
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={PlayIcon}
                      size={13}
                      fill="currentColor"
                    />{" "}
                    {copy.routes.runRoute}
                  </>
                )}
              </Button>
            </div>
          }
        />
        <div className="relative h-[calc(100vh-82px)] min-w-0">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={flow!.edges}
              nodeTypes={{ flow: FlowNode }}
              onNodeClick={(_, n) => setInspected(n as Node<FlowData>)}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.5}
              maxZoom={1.25}
            >
              <Background color="#dededb" gap={32} size={1} />
              <Controls position="bottom-left" showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
          <AnimatePresence>
            {inspected && (
              <motion.aside
                initial={{ opacity: 0, x: 20, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                transition={spring}
                className="absolute bottom-5 right-5 top-5 z-20 w-[320px] rounded-[24px] bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,.12)] backdrop-blur-2xl"
              >
                <button
                  onClick={() => setInspected(null)}
                  className="absolute right-5 top-5"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={15} />
                </button>
                <h3 className="text-[20px] font-semibold tracking-[-.035em]">
                  {inspected.data.label}
                </h3>
                <p className="mt-2 text-[12px] text-[#858580]">
                  {inspected.data.detail}
                </p>
                <div className="mt-8 rounded-[16px] bg-black/[.04] p-4">
                  <div className="text-[10px] font-medium">
                    {copy.flow.configuration}
                  </div>
                  {inspected.data.action === "read_files" ? (
                    <>
                      <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) =>
                          setInputFiles(Array.from(event.target.files || []))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={runningServer}
                        className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] bg-white px-3 py-2.5 text-[10px] font-medium shadow-sm disabled:opacity-40"
                      >
                        <HugeiconsIcon icon={Upload01Icon} size={13} />
                        {inputFiles.length
                          ? `${inputFiles.length} ${inputFiles.length === 1 ? "file" : "files"} selected`
                          : "Choose input files"}
                      </button>
                    </>
                  ) : (
                    <p className="mt-2 text-[10px] leading-5 text-[#777772]">
                      {inspected.data.action === "create_file"
                        ? "Creates a downloadable Markdown file."
                        : copy.flow.usesConnectedAccount(
                            inspected.data.integration || selected.systems[0],
                          )}
                    </p>
                  )}
                </div>
                {Number(inspected.id) < step && (
                  <div className="mt-3 rounded-[16px] bg-[#edf6ef] p-4">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-[#347248]">
                      <HugeiconsIcon icon={CheckIcon} size={13} />{" "}
                      {copy.flow.completed}
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-[#55725e]">
                      {copy.flow.outputPassed}
                    </p>
                  </div>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
          {step > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-[10px] font-medium shadow-lg backdrop-blur-xl"
            >
              <span
                className={`h-2 w-2 rounded-full ${step >= completeStep ? "bg-[#57a26b]" : "animate-pulse bg-[#ff7a35]"}`}
              />
              {step >= completeStep
                ? copy.routes.routeComplete
                : review
                  ? copy.routes.waitingForReview
                  : copy.routes.stepProgress(step, nodes.length)}
            </motion.div>
          )}
          {runError && (
            <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2.5 text-[10px] font-medium text-white shadow-lg">
              {runError}
            </div>
          )}
          {review && (
            <ReviewSheet
              continueRoute={() => {
                setReview(false);
                setStep((value) => value + 1);
              }}
            />
          )}
        </div>
      </div>
      <div
        role="separator"
        aria-label={copy.routes.pastExecutions}
        aria-orientation="vertical"
        aria-valuemin={260}
        aria-valuemax={560}
        aria-valuenow={historyWidth}
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const bounds =
            event.currentTarget.parentElement!.getBoundingClientRect();
          const maximum = Math.max(260, Math.min(560, bounds.width - 480));
          setHistoryWidth(
            Math.min(maximum, Math.max(260, bounds.right - event.clientX)),
          );
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          setHistoryWidth((width) =>
            Math.min(
              560,
              Math.max(260, width + (event.key === "ArrowLeft" ? 24 : -24)),
            ),
          );
        }}
        className="z-30 h-screen cursor-col-resize touch-none outline-none"
      />
      <aside className="flex h-screen min-h-0 flex-col bg-white/55 p-3 backdrop-blur-xl">
        <div
          role="tablist"
          aria-label={routePanelLabel[lang]}
          className="grid grid-cols-2 rounded-[13px] bg-black/[.055] p-1"
        >
          {(["chat", "history"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={sideTab === tab}
              onClick={() => setSideTab(tab)}
              className={`pressable rounded-[10px] px-2 py-2 text-[10px] font-semibold transition ${sideTab === tab ? "bg-white text-[#292927] shadow-sm" : "text-[#858580] hover:text-[#555550]"}`}
            >
              {tab === "chat" ? chatCopy.tab : chatCopy.historyTab}
            </button>
          ))}
        </div>
        <div className="relative min-h-0 flex-1 pt-3">
          <AnimatePresence mode="wait" initial={false}>
            {sideTab === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={panelTransition}
                className="absolute inset-0 flex h-full min-h-0 flex-col"
              >
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-2">
                  <div className="flex items-center gap-2.5 px-1 pb-2">
                    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#fff0e8] text-[#cb501d]">
                      <HugeiconsIcon icon={BotIcon} size={15} />
                    </span>
                    <h2 className="text-[12px] font-semibold">
                      {chatCopy.title}
                    </h2>
                  </div>
                  <div className="max-w-[92%] rounded-[16px] rounded-tl-[5px] bg-black/[.045] px-3.5 py-3 text-[11px] leading-5 text-[#686863]">
                    {chatCopy.intro}
                  </div>
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`w-fit max-w-[92%] rounded-[16px] px-3.5 py-3 text-[11px] leading-5 ${message.role === "user" ? "ml-auto rounded-tr-[5px] bg-[#20201f] text-white" : "rounded-tl-[5px] bg-black/[.045] text-[#686863]"}`}
                    >
                      {message.text}
                    </div>
                  ))}
                  {chatting && (
                    <div className="flex w-fit items-center gap-2 rounded-[16px] rounded-tl-[5px] bg-black/[.045] px-3.5 py-3 text-[10px] text-[#777772]">
                      <LoadingOrb state="listening" />
                      {copy.routes.running}
                    </div>
                  )}
                </div>
                <form onSubmit={sendEdit} className="pt-3">
                  <div className="flex items-end gap-2 rounded-[16px] bg-black/[.055] p-2 pl-3.5">
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={3}
                      placeholder={chatCopy.placeholder}
                      className="max-h-36 min-h-16 min-w-0 flex-1 resize-none bg-transparent py-2 text-[12px] leading-5 outline-none placeholder:text-[#aaa9a4]"
                    />
                    <button
                      type="submit"
                      aria-label={chatCopy.tab}
                      disabled={!chatInput.trim() || chatting}
                      className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#20201f] text-white disabled:opacity-35"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : selectedExecution ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={panelTransition}
                className="absolute inset-0 h-full overflow-y-auto px-2 py-2"
              >
                <button
                  onClick={() => setSelectedExecutionId(undefined)}
                  className="pressable flex items-center gap-2 text-[10px] font-medium text-[#777772]"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
                  {copy.routes.pastExecutions}
                </button>
                <h2 className="mt-5 text-[18px] font-semibold tracking-[-.035em]">
                  {executionCopy.title}
                </h2>
                <div className="mt-4 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.035)]">
                  <div
                    className={`flex items-center gap-2 text-[11px] font-semibold ${selectedExecution.status === "failed" ? "text-red-600" : selectedExecution.status === "running" ? "text-[#b95c28]" : "text-[#3f7b50]"}`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full ${selectedExecution.status === "failed" ? "bg-red-50" : selectedExecution.status === "running" ? "bg-[#fff0e8]" : "bg-[#eaf4ec]"}`}
                    >
                      {selectedExecution.status === "running" ? (
                        <LoadingOrb state="solving" />
                      ) : (
                        <HugeiconsIcon
                          icon={
                            selectedExecution.status === "failed"
                              ? Cancel01Icon
                              : CheckIcon
                          }
                          size={12}
                        />
                      )}
                    </span>
                    {selectedExecution.status === "running"
                      ? copy.routes.running
                      : selectedExecution.status === "failed"
                        ? copy.routes.failedStatus
                        : selectedExecution.reviewed
                          ? copy.routes.reviewStatus
                          : copy.routes.completedStatus}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[9px] text-[#92928d]">
                    <span>{executionTime(selectedExecution.createdAt)}</span>
                    {selectedExecution.status !== "running" && (
                      <span>
                        {executionDuration(selectedExecution.durationMs)}
                      </span>
                    )}
                  </div>
                </div>
                {selectedExecution.status !== "running" && (
                  <div className="mt-6">
                    <div className="text-[11px] font-medium text-[#777772]">
                      {executionCopy.summary}
                    </div>
                    {selectedExecution.status === "failed" ? (
                      <div className="mt-2 rounded-[16px] bg-red-50 p-4 text-[11px] leading-5 text-red-700">
                        {selectedExecution.output}
                      </div>
                    ) : selectedExecution.outputName ? (
                      <MarkdownFileViewer
                        output={selectedExecution.output}
                        name={selectedExecution.outputName}
                        href={
                          /^\d+$/.test(selected.id)
                            ? `/api/routes/${selected.id}/runs/${selectedExecution.id}/file`
                            : undefined
                        }
                      />
                    ) : (
                      <RunResult
                        key={selectedExecution.id}
                        output={
                          selectedExecution.output || executionCopy.created
                        }
                      />
                    )}
                  </div>
                )}
                {selectedExecution.status === "failed" && (
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setSelectedExecutionId(undefined);
                      setSideTab("chat");
                    }}
                  >
                    {copy.routes.fixRoute}
                  </Button>
                )}
                {!!selectedExecution.completedSteps?.length && (
                  <div className="mt-6">
                    <div className="text-[11px] font-medium text-[#777772]">
                      {executionCopy.steps}
                    </div>
                    <div className="mt-3 space-y-3">
                      {(selectedExecution.completedSteps || []).map((label) => (
                        <div key={label} className="flex items-center gap-2.5">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eaf4ec] text-[#4a8a5d]">
                            <HugeiconsIcon icon={CheckIcon} size={10} />
                          </span>
                          <span className="text-[10px] text-[#686863]">
                            {routeStepAlias(
                              {
                                label,
                                action: selected.steps?.find(
                                  (step) => step.label === label,
                                )?.action,
                              },
                              selected.systems,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedExecution.reviewed && (
                  <div className="mt-6 rounded-[16px] bg-[#fff1e9] p-4 text-[10px] leading-5 text-[#8b512f]">
                    {executionCopy.review}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={panelTransition}
                className="absolute inset-0 h-full overflow-y-auto px-2 py-2"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[12px] font-semibold">
                    {copy.routes.pastExecutions}
                  </h2>
                  <span className="rounded-full bg-black/[.05] px-2 py-1 text-[9px] text-[#777772]">
                    {executions.length}
                  </span>
                </div>
                <div className="mt-5 space-y-2">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="rounded-[16px] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,.035)]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedExecutionId(execution.id)}
                        className="pressable w-full text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex items-center gap-2 text-[10px] font-semibold ${execution.status === "failed" ? "text-red-600" : ""}`}
                          >
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full ${execution.status === "failed" ? "bg-red-50 text-red-600" : execution.status === "running" ? "bg-[#fff0e8] text-[#d56730]" : "bg-[#eaf4ec] text-[#4a8a5d]"}`}
                            >
                              {execution.status === "running" ? (
                                <LoadingOrb state="solving" />
                              ) : (
                                <HugeiconsIcon
                                  icon={
                                    execution.status === "failed"
                                      ? Cancel01Icon
                                      : CheckIcon
                                  }
                                  size={11}
                                />
                              )}
                            </span>
                            {execution.status === "running"
                              ? copy.routes.running
                              : execution.status === "failed"
                                ? copy.routes.failedStatus
                                : execution.reviewed
                                  ? copy.routes.reviewStatus
                                  : copy.routes.completedStatus}
                          </span>
                          <HugeiconsIcon
                            icon={ChevronRightIcon}
                            size={11}
                            className="text-[#aaa9a4]"
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[9px] text-[#92928d]">
                          <span>{executionTime(execution.createdAt)}</span>
                          {execution.status !== "running" && (
                            <span>
                              {executionDuration(execution.durationMs)}
                            </span>
                          )}
                        </div>
                      </button>
                      {execution.status === "failed" && (
                        <button
                          type="button"
                          onClick={() => setSideTab("chat")}
                          className="pressable mt-3 rounded-full bg-red-50 px-3 py-1.5 text-[9px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          {copy.routes.fixRoute}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
      {renderDeleteDialog()}
    </div>
  );
}

function ReviewSheet({ continueRoute }: { continueRoute: () => void }) {
  const { copy } = useLocale();
  const [choice, setChoice] = useState(0);
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/10 p-5 backdrop-blur-[3px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-[430px] rounded-[28px] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,.18)]"
      >
        <h3 className="text-[23px] font-semibold tracking-[-.04em]">
          {copy.review.title}
        </h3>
        <p className="mt-2 text-[12px] leading-5 text-[#777772]">
          {copy.review.description}
        </p>
        <div className="mt-5 space-y-2">
          {copy.review.choices.map((item, i) => (
            <button
              key={item[0]}
              onClick={() => setChoice(i)}
              className={`pressable flex w-full items-center rounded-[16px] p-4 text-left ${choice === i ? "bg-[#fff1e9]" : "bg-black/[.035]"}`}
            >
              <span
                className={`mr-3 grid h-4 w-4 place-items-center rounded-full ${choice === i ? "bg-[#ff7a35]" : "bg-black/10"}`}
              >
                {choice === i && (
                  <HugeiconsIcon
                    icon={CircleIcon}
                    size={6}
                    fill="white"
                    className="text-white"
                  />
                )}
              </span>
              <span className="text-[11px] font-semibold">{item[0]}</span>
              <span className="ml-auto text-[12px] font-semibold">
                {item[1]}
              </span>
            </button>
          ))}
        </div>
        <Button onClick={continueRoute} className="mt-5 w-full">
          {copy.review.continue}{" "}
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
        </Button>
      </motion.div>
    </div>
  );
}

type CatalogToolkit = {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
};

let toolkitsRequest: Promise<CatalogToolkit[]> | undefined;

function fetchToolkits() {
  if (!toolkitsRequest) {
    toolkitsRequest = fetch("/api/integrations/toolkits")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Could not load systems.",
          );
        return (data.toolkits ?? []) as CatalogToolkit[];
      })
      .catch((error) => {
        toolkitsRequest = undefined;
        throw error;
      });
  }
  return toolkitsRequest;
}

function toolkitKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const toolkitAliases: Record<string, string> = {
  "Microsoft 365": "outlook",
};

function toolkitLogo(toolkits: CatalogToolkit[] | null, name: string) {
  if (!toolkits) return;
  const key = toolkitAliases[name] || toolkitKey(name);
  const item = toolkits.find(
    (toolkit) =>
      toolkitKey(toolkit.name) === key || toolkitKey(toolkit.slug) === key,
  );
  return item?.logo;
}

function SystemCatalog({
  toolkits,
  busy,
  error,
  integrations,
  onConnect,
  onClose,
}: {
  toolkits: CatalogToolkit[] | null;
  busy: boolean;
  error: string;
  integrations: string[];
  onConnect: (name: string) => void;
  onClose: () => void;
}) {
  const { copy } = useLocale();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = (toolkits ?? [])
    .filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q),
    )
    .sort((a, b) => {
      const aOn = integrations.includes(a.name) ? 0 : 1;
      const bOn = integrations.includes(b.name) ? 0 : 1;
      return aOn - bOn;
    });
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-title"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="flex max-h-[min(80vh,720px)] w-full max-w-[720px] flex-col rounded-[24px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,.2)]"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="catalog-title"
            className="text-[21px] font-semibold tracking-[-.035em]"
          >
            {copy.sources.allSystems}
          </h2>
          <button
            type="button"
            aria-label={copy.sources.cancel}
            onClick={onClose}
            className="pressable text-[#999994] hover:text-black"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
        <label className="relative mt-5 block">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa9a5]"
            size={15}
          />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.sources.searchSystems}
            className="h-12 w-full rounded-[14px] bg-[#f7f7f5] pl-10 pr-4 text-[13px] outline-none ring-[#ff7a35] placeholder:text-[#aaa9a5] focus:ring-2"
          />
        </label>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {busy ? (
            <div className="grid place-items-center py-16 text-[#92928d]">
              <LoadingOrb state="searching" size="center" />
            </div>
          ) : error ? (
            error === "Composio is not configured." ? (
              <div className="grid place-items-center gap-3 py-16 text-center">
                <p className="text-[12px] leading-5 text-[#777772]">
                  {copy.sources.catalogUnavailable}
                </p>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-2 text-[12px] font-medium text-[#20201f] hover:text-black"
                >
                  <GitHubMark className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </div>
            ) : (
              <p className="py-16 text-center text-[12px] text-[#777772]">
                {error}
              </p>
            )
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-[12px] text-[#777772]">
              {copy.sources.noMatchingSystems}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {visible.map((item) => {
                const active = integrations.includes(item.name);
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => onConnect(item.name)}
                    className={`pressable flex items-center gap-3 rounded-[18px] p-4 text-left transition ${active ? "bg-[#232321] text-white shadow-lg shadow-black/10" : "bg-[#f7f7f5] hover:bg-[#f0f0ed]"}`}
                  >
                    <SystemMark name={item.name} logo={item.logo ?? ""} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium">
                        {item.name}
                      </div>
                      <div
                        className={`mt-1 text-[9px] ${active ? "text-white/70" : "text-[#92928d]"}`}
                      >
                        {active ? copy.sources.connected : copy.sources.connect}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function Sources({
  company,
  profileType = "company",
  files,
  integrations,
  onGenerate,
  generating = false,
  onUpdateProfile,
  onUpdateFiles,
  onUpdateIntegrations,
}: {
  company: Company;
  profileType?: "company" | "personal";
  files: SourceFile[];
  integrations: string[];
  onGenerate?: () => void;
  generating?: boolean;
  onUpdateProfile: (
    company: Company,
    profileType: "company" | "personal",
  ) => void;
  onUpdateFiles: (files: SourceFile[]) => void;
  onUpdateIntegrations: (integrations: string[]) => void | Promise<void>;
}) {
  const { copy } = useLocale();
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftCompany, setDraftCompany] = useState(company);
  const [draftProfileType, setDraftProfileType] = useState(profileType);
  const [pendingDisconnect, setPendingDisconnect] = useState<string>();
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [toolkits, setToolkits] = useState<CatalogToolkit[] | null>(null);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const loadCatalog = () => {
    if (toolkits || catalogBusy) return;
    setCatalogBusy(true);
    setCatalogError("");
    void fetchToolkits()
      .then(setToolkits)
      .catch((error) => {
        setCatalogError(
          error instanceof Error ? error.message : copy.sources.catalogError,
        );
      })
      .finally(() => setCatalogBusy(false));
  };
  useEffect(() => {
    loadCatalog();
  }, []);
  const openCatalog = () => {
    setCatalogOpen(true);
    loadCatalog();
  };
  const shownSystems = [
    ...integrations,
    ...suggestedIntegrations(profileType).filter(
      (name) => !integrations.includes(name),
    ),
  ].slice(0, 6);
  const field = (key: keyof Company, value: string) =>
    setDraftCompany((c) => ({ ...c, [key]: value }));
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    onUpdateFiles(
      [
        ...files,
        ...Array.from(list).map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      ].filter((v, i, a) => a.findIndex((x) => x.name === v.name) === i),
    );
  };
  const connect = (name: string) => {
    if (integrations.includes(name)) {
      setDisconnectError("");
      setPendingDisconnect(name);
      return;
    }
    onUpdateIntegrations([...integrations, name]);
  };
  const disconnect = async () => {
    if (!pendingDisconnect) return;
    setDisconnecting(true);
    try {
      await onUpdateIntegrations(
        integrations.filter((name) => name !== pendingDisconnect),
      );
      setPendingDisconnect(undefined);
    } catch (error) {
      setDisconnectError(
        error instanceof Error
          ? error.message
          : `Could not disconnect ${pendingDisconnect}.`,
      );
    } finally {
      setDisconnecting(false);
    }
  };
  const startEditProfile = () => {
    setDraftCompany(company);
    setDraftProfileType(profileType);
    setEditingProfile(true);
  };
  const saveProfile = () => {
    onUpdateProfile(draftCompany, draftProfileType);
    setEditingProfile(false);
  };
  const hasSources = files.length > 0 || integrations.length > 0;
  return (
    <div>
      <ShellHeader
        title={copy.sources.title}
        subtitle={copy.sources.subtitle}
        action={
          <span className="group relative inline-flex">
            <Button disabled={!hasSources || generating} onClick={onGenerate}>
              {generating ? (
                <LoadingOrb state="searching" theme="dark" />
              ) : (
                <HugeiconsIcon icon={SparklesIcon} size={13} />
              )}
              Generate opportunities
            </Button>
            {!hasSources && (
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-[calc(100%+10px)] z-30 w-60 origin-top-right rounded-xl bg-[#20201f] px-3 py-2 text-center text-[11px] font-medium leading-4 text-white opacity-0 shadow-[0_10px_30px_rgba(0,0,0,.22)] transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
              >
                Connect a source first to generate opportunities.
              </span>
            )}
          </span>
        }
      />
      <div className="mx-auto max-w-[920px] p-10">
        <section>
          <h2 className="text-[13px] font-semibold">
            {copy.sources.connectedSystems}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {shownSystems.map((name) => {
              const active = integrations.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => connect(name)}
                  className={`pressable flex items-center gap-3 rounded-[18px] p-4 text-left transition ${active ? "bg-[#232321] text-white shadow-lg shadow-black/10" : "bg-white hover:bg-[#fdfdfc]"}`}
                >
                  <SystemMark
                    name={name}
                    logo={toolkitLogo(toolkits, name) ?? ""}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium">{name}</div>
                    <div
                      className={`mt-1 text-[9px] ${active ? "text-white/70" : "text-[#92928d]"}`}
                    >
                      {active ? copy.sources.connected : copy.sources.connect}
                    </div>
                  </div>
                  {active ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="text-[#75cb8a]"
                      size={15}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="text-[#aaa9a4]"
                      size={14}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={openCatalog}
            className="pressable mt-3 flex w-full items-center justify-center rounded-[18px] bg-white p-4 text-[12px] font-medium text-[#777772] hover:bg-[#fdfdfc]"
          >
            {copy.sources.more}
          </button>
        </section>
        <section className="mt-10">
          <h2 className="text-[13px] font-semibold">
            {profileType === "personal"
              ? "Personal knowledge"
              : copy.sources.companyKnowledge}
          </h2>
          <input
            ref={input}
            type="file"
            multiple
            accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,image/*"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            className="pressable mt-4 flex h-[96px] w-full flex-col items-center justify-center rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_35px_rgba(0,0,0,.035)]"
          >
            <HugeiconsIcon icon={Upload01Icon} size={17} />
            <span className="mt-2 text-[12px] font-medium">
              {copy.onboarding.uploadTitle}
            </span>
            <span className="mt-1 text-[10px] text-[#92928d]">
              {copy.onboarding.uploadHint}
            </span>
          </button>
          <div className="mt-3 space-y-2">
            {files.length ? (
              files.map((f, i) => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-3"
                >
                  <HugeiconsIcon icon={File01Icon} size={15} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                    {f.name}
                  </span>
                  <span className="text-[9px] text-[#999994]">
                    {Math.max(1, Math.round(f.size / 1024))} KB ·{" "}
                    {copy.sources.ready}
                  </span>
                  <button
                    aria-label={copy.sources.disconnect}
                    onClick={() =>
                      onUpdateFiles(files.filter((_, x) => x !== i))
                    }
                    className="pressable text-[#999994] hover:text-black"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] bg-white p-6 text-[11px] text-[#888883]">
                {profileType === "personal"
                  ? "No documents uploaded. Heighliner is using your profile description."
                  : copy.sources.noDocuments}
              </div>
            )}
          </div>
        </section>
        <section className="mt-10 rounded-[22px] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[13px] font-semibold">
              {editingProfile
                ? draftProfileType === "personal"
                  ? "Your profile"
                  : copy.onboarding.companyName
                : company.name}
            </h2>
            {!editingProfile ? (
              <Button secondary onClick={startEditProfile}>
                {copy.sources.editProfile}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button secondary onClick={() => setEditingProfile(false)}>
                  {copy.sources.cancel}
                </Button>
                <Button
                  disabled={
                    !draftCompany.name.trim() ||
                    !draftCompany.description.trim()
                  }
                  onClick={saveProfile}
                >
                  {copy.sources.save}
                </Button>
              </div>
            )}
          </div>
          {editingProfile ? (
            <div className="mt-5">
              <div className="mb-5 inline-flex items-center gap-1 rounded-[11px] bg-black/[.035] p-1">
                {(["company", "personal"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDraftProfileType(type)}
                    className={`pressable min-w-[92px] rounded-[8px] px-3 py-2 text-[11px] font-medium capitalize ${draftProfileType === type ? "bg-white shadow-sm" : "text-[#777772]"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label={
                    draftProfileType === "personal"
                      ? "Your name"
                      : copy.onboarding.companyName
                  }
                  value={draftCompany.name}
                  onChange={(v) => field("name", v)}
                  placeholder={
                    draftProfileType === "personal"
                      ? "Your name"
                      : copy.onboarding.companyPlaceholder
                  }
                />
                {draftProfileType === "company" && (
                  <>
                    <TextField
                      label={copy.onboarding.teamSize}
                      value={draftCompany.size}
                      onChange={(v) => field("size", v)}
                      select
                      selectOptions={copy.onboarding.teamSizes}
                    />
                    <TextField
                      wide
                      label={copy.onboarding.companyDoes}
                      value={draftCompany.description}
                      onChange={(v) => field("description", v)}
                      placeholder={
                        copy.onboarding.companyDescriptionPlaceholder
                      }
                    />
                    <TextField
                      label={copy.onboarding.departments}
                      value={draftCompany.departments}
                      onChange={(v) => field("departments", v)}
                      placeholder={copy.onboarding.departmentsPlaceholder}
                    />
                    <TextField
                      label={copy.onboarding.processes}
                      value={draftCompany.processes}
                      onChange={(v) => field("processes", v)}
                      placeholder={copy.onboarding.processesPlaceholder}
                    />
                    <TextField
                      wide
                      label={copy.onboarding.bottlenecks}
                      value={draftCompany.bottlenecks}
                      onChange={(v) => field("bottlenecks", v)}
                      placeholder={copy.onboarding.bottlenecksPlaceholder}
                    />
                  </>
                )}
                {draftProfileType === "personal" && (
                  <TextField
                    wide
                    label="About your work"
                    value={draftCompany.description}
                    onChange={(v) => field("description", v)}
                    placeholder="What kind of work do you want to improve?"
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-[12px] leading-5 text-[#777772]">
                {company.description}
              </p>
              {profileType === "company" && (
                <div className="mt-5 grid grid-cols-2 gap-5 text-[10px]">
                  <div>
                    <span className="block text-[#999994]">
                      {copy.sources.departments}
                    </span>
                    <span className="mt-1 block font-medium">
                      {company.departments || copy.sources.notProvided}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#999994]">
                      {copy.sources.bottlenecks}
                    </span>
                    <span className="mt-1 block font-medium">
                      {company.bottlenecks || copy.sources.notProvided}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {catalogOpen && (
        <SystemCatalog
          toolkits={toolkits}
          busy={catalogBusy}
          error={catalogError}
          integrations={integrations}
          onConnect={connect}
          onClose={() => setCatalogOpen(false)}
        />
      )}
      {pendingDisconnect && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !disconnecting)
              setPendingDisconnect(undefined);
          }}
        >
          <motion.section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="disconnect-title"
            aria-describedby="disconnect-description"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={spring}
            className="w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,.2)]"
          >
            <h2
              id="disconnect-title"
              className="text-[21px] font-semibold tracking-[-.035em]"
            >
              Disconnect {pendingDisconnect}?
            </h2>
            <p
              id="disconnect-description"
              className="mt-2 text-[12px] leading-5 text-[#777772]"
            >
              Heighliner will lose access to this account and remove its
              imported source data. You can reconnect it later.
            </p>
            {disconnectError && (
              <p className="mt-3 text-[11px] text-red-600">{disconnectError}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                secondary
                disabled={disconnecting}
                onClick={() => setPendingDisconnect(undefined)}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={disconnecting}
                onClick={() => void disconnect()}
                className="pressable inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {disconnecting && (
                  <LoadingOrb state="connecting" theme="dark" />
                )}
                Disconnect
              </button>
            </div>
          </motion.section>
        </div>
      )}
    </div>
  );
}

type LocalWorkspaceResponse = {
  user: { email: string; avatar: string | null };
  workspace: {
    name: string;
    description: string;
    profileType: "company" | "personal";
  } | null;
  sources: { id: number; name: string; kind: string }[];
  opportunities: {
    id: number;
    title: string;
    description: string;
    status: string;
  }[];
  routes: {
    id: number;
    opportunityId: number | null;
    title: string;
    description: string;
    hours: number;
    systems: string[] | null;
    steps: RouteStep[] | null;
    executions: RouteExecution[];
  }[];
};

export function LocalDashboard() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("Sources");
  const [workspace, setWorkspace] = useState<LocalWorkspaceResponse | null>(
    null,
  );
  const [profileType, setProfileType] = useState<"company" | "personal">(
    "company",
  );
  const [profileName, setProfileName] = useState("");
  const [setupStep, setSetupStep] = useState(0);
  const [setupOpen, setSetupOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string>();
  const [avatar, setAvatar] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const load = async (initialize = false) => {
    const response = await fetch("/api/workspace");
    if (!response.ok) return;
    const data = (await response.json()) as LocalWorkspaceResponse;
    const legacyAvatar = initialize
      ? localStorage.getItem("heighliner-avatar")
      : null;
    if (!data.user.avatar && legacyAvatar) {
      const migration = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: legacyAvatar }),
      });
      if (migration.ok) {
        data.user.avatar = legacyAvatar;
        localStorage.removeItem("heighliner-avatar");
      }
    }
    setWorkspace(data);
    setAvatar(data.user.avatar || "");
    if (data.workspace) {
      setProfileName(data.workspace.name);
      setProfileType(data.workspace.profileType);
    }
    if (!data.workspace) setSetupStep(0);
    else if (!data.opportunities.length) setSetupStep(1);
    else setSetupStep(2);
    if (initialize) {
      setSetupOpen(!data.workspace);
      if (data.routes.length) setView("Routes");
    }
  };

  useEffect(() => {
    void (async () => {
      await fetch("/api/auth/local", { method: "POST" });
      await load(true);
      const params = new URLSearchParams(window.location.search);
      if (params.get("source") === "gmail") {
        setBusy("gmail");
        const response = await fetch("/api/integrations/gmail", {
          method: "POST",
        });
        const result = await response.json();
        setBusy("");
        if (!response.ok)
          setError(result.error || "Could not finish connecting Gmail.");
        await load();
        history.replaceState(null, "", "/app");
      }
      setReady(true);
    })();
  }, []);

  const company: Company = {
    ...companyDefaults,
    name: workspace?.workspace?.name || profileName || "Your workspace",
    description:
      workspace?.workspace?.description ||
      (profileType === "company" ? "Company workspace" : "Personal workspace"),
  };
  const files: SourceFile[] = (workspace?.sources || [])
    .filter((source) => source.kind !== "gmail")
    .map((source) => ({ name: source.name, size: 0, type: source.kind }));
  const integrations = (workspace?.sources || []).some(
    (source) => source.kind === "gmail",
  )
    ? ["Gmail"]
    : [];
  const opportunities: Opportunity[] = (workspace?.opportunities || []).map(
    (item, index) => ({
      id: `opp_${item.id}`,
      title: item.title,
      description: item.description,
      evidence: "Found in your connected sources",
      hours: Math.max(2, 8 - index),
      impact: index < 3 ? "High" : "Medium",
      effort: index < 2 ? "Low" : "Medium",
      confidence: 94 - index * 3,
      status: item.status === "converted" ? "converted" : "open",
      systems: integrations.length
        ? ["Gmail", "Company knowledge"]
        : ["Company knowledge"],
    }),
  );
  const routes: RouteData[] = (workspace?.routes || []).map((item) => ({
    id: String(item.id),
    opportunityId: item.opportunityId ? `opp_${item.opportunityId}` : undefined,
    title: item.title,
    description: item.description,
    hours: item.hours,
    systems:
      item.systems ||
      (integrations.length
        ? ["Gmail", "Company knowledge"]
        : ["Company knowledge"]),
    createdAt: item.id,
    steps: item.steps || undefined,
    executions: item.executions,
  }));

  const saveProfile = async () => {
    if (!profileName.trim()) return;
    setBusy("profile");
    setError("");
    const response = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profileName,
        profileType,
        description:
          profileType === "company"
            ? `${profileName} company workspace`
            : `${profileName}'s personal workspace`,
      }),
    });
    setBusy("");
    if (!response.ok) return setError("Could not save the workspace.");
    await load();
    setSetupStep(1);
    setView("Sources");
  };
  const saveProfileFromSources = async (
    nextCompany: Company,
    nextType: "company" | "personal",
  ) => {
    setBusy("profile");
    setError("");
    const response = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextCompany.name,
        description: nextCompany.description,
        profileType: nextType,
      }),
    });
    setBusy("");
    if (!response.ok) return setError("Could not save the profile.");
    setProfileName(nextCompany.name);
    setProfileType(nextType);
    await load();
  };
  const changeAvatar = (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024)
      return setError("Choose an image smaller than 2 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      const next = String(reader.result || "");
      void (async () => {
        setBusy("avatar");
        setError("");
        const response = await fetch("/api/workspace", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: next }),
        });
        setBusy("");
        if (!response.ok) {
          const result = await response.json();
          setError(result.error || "That image could not be saved.");
          return;
        }
        setAvatar(next);
      })();
    };
    reader.readAsDataURL(file);
  };
  const resetOnboarding = async () => {
    setBusy("reset");
    setError("");
    const response = await fetch("/api/workspace", { method: "DELETE" });
    setBusy("");
    if (!response.ok) return setError("Could not reset your local data.");
    Object.keys(localStorage)
      .filter((key) => key.startsWith("heighliner-"))
      .forEach((key) => localStorage.removeItem(key));
    setAvatar("");
    setProfileName("");
    setProfileType("company");
    setSelected(undefined);
    setView("Sources");
    setSetupStep(0);
    setResetOpen(false);
    await load();
    setSetupOpen(true);
  };
  const connectGmail = async () => {
    setBusy("gmail");
    setError("");
    const response = await fetch("/api/integrations/gmail", { method: "POST" });
    const result = await response.json();
    setBusy("");
    if (!response.ok)
      return setError(result.error || "Could not connect Gmail.");
    if (result.redirectUrl) return window.location.assign(result.redirectUrl);
    await load();
  };
  const disconnectGmail = async () => {
    setBusy("gmail");
    setError("");
    const response = await fetch("/api/integrations/gmail", {
      method: "DELETE",
    });
    const result = await response.json();
    setBusy("");
    if (!response.ok) {
      setError(result.error || "Could not disconnect Gmail.");
      throw new Error(result.error || "Could not disconnect Gmail.");
    }
    await load();
  };
  const uploadFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy("files");
    setError("");
    for (const file of Array.from(list)) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/sources", { method: "POST", body });
      if (!response.ok) {
        setError((await response.json()).error || "Could not add a file.");
        break;
      }
    }
    setBusy("");
    await load();
  };
  const generate = async () => {
    setBusy("generate");
    setError("");
    const response = await fetch("/api/opportunities/generate", {
      method: "POST",
    });
    setBusy("");
    if (!response.ok)
      return setError(
        (await response.json()).error || "Could not generate opportunities.",
      );
    await load();
    setSetupStep(2);
    setView("Opportunities");
  };
  const createRoute = async (opportunity: Opportunity) => {
    setBusy(`route-${opportunity.id}`);
    setError("");
    const response = await fetch(`/api/opportunities/${opportunity.id}/route`, {
      method: "POST",
    });
    const result = await response.json();
    setBusy("");
    if (!response.ok)
      return setError(result.error || "Could not create the route.");
    await load();
    setSetupOpen(false);
    setView("Routes");
    setSelected(undefined);
  };
  const createManualOpportunity = async (
    title: string,
    description: string,
  ) => {
    const response = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Could not create the opportunity.");
    }
    await load();
  };
  const deleteOpportunity = async (opportunity: Opportunity) => {
    const response = await fetch(`/api/opportunities/${opportunity.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Could not delete the opportunity.");
      return;
    }
    await load();
  };
  const deleteRoute = async (route: RouteData) => {
    const response = await fetch(`/api/routes/${route.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Could not delete the route.");
      return false;
    }
    await load();
    return true;
  };

  if (!ready || !workspace)
    return <div className="min-h-screen bg-[#f7f7f5]" />;
  return (
    <LocaleContext.Provider
      value={{ lang: "en", setLang: () => {}, copy: translations.en }}
    >
      <div className="min-h-screen bg-[#f7f7f5]">
        <Sidebar
          view={view}
          setView={setView}
          routes={routes}
          selected={selected}
          selectRoute={(id) => {
            setSelected(id);
            setView("Routes");
          }}
          showRoutes={() => {
            setSelected(undefined);
            setView("Routes");
          }}
          opportunities={opportunities}
          selectOpportunity={(id) => {
            setView("Opportunities");
            setTimeout(
              () =>
                document
                  .getElementById(`opportunity-${id}`)
                  ?.scrollIntoView({ behavior: "smooth" }),
              50,
            );
          }}
          reset={() => setView("Routes")}
          contact={() => {}}
          account={{
            name: workspace.workspace?.name || profileName || "Your profile",
            email: workspace.user.email,
            avatar,
            onAvatarChange: changeAvatar,
            onReset: () => setResetOpen(true),
          }}
        />
        <main className="ml-[250px] min-h-screen">
          {view === "Routes" && (
            <Routes
              routes={routes}
              selectedId={selected}
              setSelected={setSelected}
              updateRoute={() => void load()}
              removeRoute={deleteRoute}
              showOpportunities={() => setView("Opportunities")}
            />
          )}
          {view === "Opportunities" && (
            <OpportunityList
              opportunities={opportunities}
              creating={busy.startsWith("route-") ? busy.slice(6) : null}
              error={error}
              create={createRoute}
              remove={deleteOpportunity}
              addSource={() => setView("Sources")}
              createManual={createManualOpportunity}
            />
          )}
          {view === "Sources" && (
            <Sources
              company={company}
              profileType={profileType}
              files={files}
              integrations={integrations}
              onGenerate={() => void generate()}
              generating={busy === "generate"}
              onUpdateProfile={(next, nextType) =>
                void saveProfileFromSources(next, nextType)
              }
              onUpdateFiles={() => {}}
              onUpdateIntegrations={async (next) => {
                if (next.includes("Gmail") && !integrations.includes("Gmail"))
                  await connectGmail();
                if (!next.includes("Gmail") && integrations.includes("Gmail"))
                  await disconnectGmail();
              }}
            />
          )}
        </main>
        {setupOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Set up Heighliner"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={spring}
              className="w-full max-w-[720px] rounded-[28px] bg-white p-7 shadow-[0_30px_100px_rgba(0,0,0,.2)]"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <span className="text-[10px] font-medium text-[#999994]">
                  {setupStep + 1} of 3
                </span>
              </div>
              <div className="mt-5 flex gap-1.5">
                {[0, 1, 2].map((step) => (
                  <span
                    key={step}
                    className={`h-1 flex-1 rounded-full ${step <= setupStep ? "bg-[#ff7a35]" : "bg-black/[.07]"}`}
                  />
                ))}
              </div>
              {setupStep === 0 && (
                <div className="mt-8">
                  <h1 className="text-[30px] font-semibold tracking-[-.045em]">
                    Who is Heighliner working for?
                  </h1>
                  <p className="mt-2 text-[12px] leading-5 text-[#777772]">
                    This helps tailor the opportunities we find.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-1 rounded-[11px] bg-black/[.035] p-1">
                    {(["company", "personal"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setProfileType(type)}
                        className={`pressable min-w-[92px] rounded-[8px] px-3 py-2 text-[11px] font-medium capitalize ${profileType === type ? "bg-white shadow-sm" : "text-[#777772]"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <label className="mt-5 block">
                    <span className="mb-2 block text-[12px] font-medium">
                      {profileType === "company" ? "Company name" : "Your name"}
                    </span>
                    <input
                      autoFocus
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void saveProfile();
                      }}
                      placeholder={
                        profileType === "company" ? "Acme Inc." : "Your name"
                      }
                      className="h-12 w-full rounded-[14px] bg-[#f7f7f5] px-4 text-[13px] outline-none ring-[#ff7a35] focus:ring-2"
                    />
                  </label>
                  <Button
                    disabled={!profileName.trim() || busy === "profile"}
                    onClick={saveProfile}
                    className="mt-6 w-full"
                  >
                    Continue <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                  </Button>
                </div>
              )}
              {setupStep === 1 && (
                <div className="mt-8">
                  <h1 className="text-[30px] font-semibold tracking-[-.045em]">
                    Where does your work happen?
                  </h1>
                  <p className="mt-2 text-[12px] leading-5 text-[#777772]">
                    Connect one or more sources. Heighliner uses them as
                    context.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={connectGmail}
                      disabled={
                        busy === "gmail" || integrations.includes("Gmail")
                      }
                      className={`pressable flex items-center gap-3 rounded-[18px] p-4 text-left ${integrations.includes("Gmail") ? "bg-[#232321] text-white" : "bg-[#f7f7f5]"}`}
                    >
                      <SystemMark name="Gmail" />
                      <div className="flex-1">
                        <div className="text-[12px] font-medium">Gmail</div>
                        <div
                          className={`mt-1 text-[9px] ${integrations.includes("Gmail") ? "text-white/65" : "text-[#92928d]"}`}
                        >
                          {integrations.includes("Gmail")
                            ? "Connected"
                            : busy === "gmail"
                              ? "Connecting…"
                              : "Connect with Composio"}
                        </div>
                      </div>
                      {integrations.includes("Gmail") ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="text-[#75cb8a]"
                          size={16}
                        />
                      ) : (
                        <HugeiconsIcon icon={Add01Icon} size={14} />
                      )}
                    </button>
                    <label className="pressable flex cursor-pointer items-center gap-3 rounded-[18px] bg-[#f7f7f5] p-4">
                      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-white">
                        <HugeiconsIcon icon={Upload01Icon} size={16} />
                      </span>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium">Files</div>
                        <div className="mt-1 text-[9px] text-[#92928d]">
                          {busy === "files"
                            ? "Uploading…"
                            : `${files.length} added · PDF, CSV, documents`}
                        </div>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) =>
                          void uploadFiles(event.target.files)
                        }
                      />
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-2 rounded-[12px] bg-[#edf6ef] px-3 py-2 text-[10px] font-medium text-[#3f7b50]"
                        >
                          <HugeiconsIcon icon={CheckIcon} size={12} />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-7 flex items-center gap-2">
                    <Button secondary onClick={() => setSetupStep(0)}>
                      Back
                    </Button>
                    <button
                      onClick={() => {
                        setSetupOpen(false);
                        setView("Sources");
                      }}
                      className="pressable px-3 py-2 text-[11px] font-medium text-[#777772]"
                    >
                      Set up later
                    </button>
                    <Button
                      disabled={
                        (!integrations.length && !files.length) ||
                        busy === "generate"
                      }
                      onClick={generate}
                      className="ml-auto"
                    >
                      {busy === "generate" ? (
                        <LoadingOrb state="searching" theme="dark" />
                      ) : (
                        <HugeiconsIcon icon={SparklesIcon} size={13} />
                      )}{" "}
                      Generate opportunities
                    </Button>
                  </div>
                </div>
              )}
              {setupStep === 2 && (
                <div className="mt-8">
                  <h1 className="text-[30px] font-semibold tracking-[-.045em]">
                    Choose what to automate first.
                  </h1>
                  <p className="mt-2 text-[12px] leading-5 text-[#777772]">
                    Create one or more routes. We’ll take you to Routes as soon
                    as the first one is ready.
                  </p>
                  <div className="mt-6 max-h-[390px] space-y-2 overflow-y-auto pr-1">
                    {opportunities.map((opportunity, index) => (
                      <article
                        key={opportunity.id}
                        className="rounded-[18px] bg-[#f7f7f5] p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[13px] font-semibold">
                                {opportunity.title}
                              </h3>
                              {index === 0 && (
                                <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[8px] font-semibold text-[#c84f1b]">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-[10px] leading-4 text-[#777772]">
                              {opportunity.description}
                            </p>
                          </div>
                          <Button
                            disabled={busy === `route-${opportunity.id}`}
                            onClick={() => createRoute(opportunity)}
                            className="shrink-0"
                          >
                            {busy === `route-${opportunity.id}` ? (
                              <LoadingOrb state="solving" theme="dark" />
                            ) : (
                              <HugeiconsIcon icon={Add01Icon} size={13} />
                            )}{" "}
                            Create route
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <p className="mt-4 text-[11px] text-red-600">{error}</p>
              )}
            </motion.section>
          </div>
        )}
        {resetOpen && (
          <div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && busy !== "reset")
                setResetOpen(false);
            }}
          >
            <motion.section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reset-title"
              aria-describedby="reset-description"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={spring}
              className="w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,.2)]"
            >
              <h2
                id="reset-title"
                className="text-[21px] font-semibold tracking-[-.035em]"
              >
                Reset onboarding?
              </h2>
              <p
                id="reset-description"
                className="mt-2 text-[12px] leading-5 text-[#777772]"
              >
                Your profile, connected sources, uploaded files, opportunities,
                and routes will be permanently deleted from this device.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  secondary
                  disabled={busy === "reset"}
                  onClick={() => setResetOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  disabled={busy === "reset"}
                  onClick={() => void resetOnboarding()}
                  className="pressable inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "reset" && <LoadingOrb theme="dark" />} Reset
                  everything
                </button>
              </div>
            </motion.section>
          </div>
        )}
      </div>
    </LocaleContext.Provider>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<View>("Routes");
  const [company, setCompany] = useState<Company>(companyDefaults);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selected, setSelected] = useState<string>();
  const [creating, setCreating] = useState<string | null>(null);
  useEffect(() => {
    const storedLang = localStorage.getItem("heighliner-language");
    const initialLang = resolveLang(
      storedLang,
      navigator.language.toLowerCase(),
    );
    setLang(initialLang);
    document.documentElement.lang = initialLang;

    const raw = localStorage.getItem("heighliner-workspace");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setCompany(data.company || companyDefaults);
        setFiles(data.files || []);
        setIntegrations(data.integrations || []);
        setOpportunities(data.opportunities || []);
        setRoutes(data.routes || []);
        setSelected(undefined);
      } catch {}
    }
    setReady(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("heighliner-language", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const persist = (data: object) =>
    localStorage.setItem("heighliner-workspace", JSON.stringify(data));
  const updateWorkspace = (patch: {
    company?: Company;
    files?: SourceFile[];
    integrations?: string[];
  }) => {
    const nextCompany = patch.company ?? company;
    const nextFiles = patch.files ?? files;
    const nextIntegrations = patch.integrations ?? integrations;
    if (patch.company) setCompany(nextCompany);
    if (patch.files) setFiles(nextFiles);
    if (patch.integrations) setIntegrations(nextIntegrations);
    persist({
      company: nextCompany,
      files: nextFiles,
      integrations: nextIntegrations,
      opportunities,
      routes,
    });
  };
  const complete = async (
    nextCompany: Company,
    nextFiles: SourceFile[],
    nextIntegrations: string[],
  ) => {
    setCompany(nextCompany);
    setFiles(nextFiles);
    setIntegrations(nextIntegrations);
    setInApp(true);
    setView("Opportunities");
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: nextCompany,
        files: nextFiles,
        integrations: nextIntegrations,
        locale: lang,
      }),
    });
    const result = await response.json();
    setOpportunities(result.opportunities);
    persist({
      company: nextCompany,
      files: nextFiles,
      integrations: nextIntegrations,
      opportunities: result.opportunities,
      routes,
    });
  };
  const isExample = company.name === exampleCompany.name;
  const createRoute = (o: Opportunity) => {
    setCreating(o.id);
    setTimeout(() => {
      const steps = isExample ? exampleRouteSteps[o.id] : undefined;
      const route: RouteData = {
        id: `route-${Date.now()}`,
        opportunityId: o.id,
        title: o.title,
        description: o.description,
        hours: o.hours,
        systems: o.systems,
        createdAt: Date.now(),
        ...(steps ? { steps } : {}),
      };
      const next = [route, ...routes];
      const nextOpportunities = opportunities.map((opportunity) =>
        opportunity.id === o.id
          ? { ...opportunity, status: "converted" as const }
          : opportunity,
      );
      setRoutes(next);
      setOpportunities(nextOpportunities);
      setSelected(route.id);
      setCreating(null);
      setView("Routes");
      persist({
        company,
        files,
        integrations,
        opportunities: nextOpportunities,
        routes: next,
      });
    }, 650);
  };
  const createManualOpportunity = async (
    title: string,
    description: string,
  ) => {
    const opportunity: Opportunity = {
      id: `opportunity-${Date.now()}`,
      title,
      description,
      evidence: "Added manually",
      hours: 4,
      impact: "Medium",
      effort: "Medium",
      confidence: 100,
      systems: integrations.length ? integrations : ["Company knowledge"],
    };
    const next = [opportunity, ...opportunities];
    setOpportunities(next);
    persist({ company, files, integrations, opportunities: next, routes });
  };
  const deleteOpportunity = async (opportunity: Opportunity) => {
    const next = opportunities.filter((item) => item.id !== opportunity.id);
    setOpportunities(next);
    persist({ company, files, integrations, opportunities: next, routes });
  };
  const deleteRoute = async (route: RouteData) => {
    const nextRoutes = routes.filter((item) => item.id !== route.id);
    const nextOpportunities = opportunities.map((opportunity) =>
      opportunity.id === route.opportunityId ||
      (!route.opportunityId && opportunity.title === route.title)
        ? { ...opportunity, status: "open" as const }
        : opportunity,
    );
    setRoutes(nextRoutes);
    setOpportunities(nextOpportunities);
    persist({
      company,
      files,
      integrations,
      opportunities: nextOpportunities,
      routes: nextRoutes,
    });
    return true;
  };
  const exploreExample = () => {
    setCompany(exampleCompany);
    setFiles(exampleFiles);
    setIntegrations(exampleIntegrations);
    setOpportunities(exampleOpportunities);
    setRoutes(exampleRoutes);
    setSelected(exampleRoutes[0]?.id);
    setInApp(true);
    setView("Routes");
    persist({
      company: exampleCompany,
      files: exampleFiles,
      integrations: exampleIntegrations,
      opportunities: exampleOpportunities,
      routes: exampleRoutes,
    });
  };
  const reset = () => setInApp(false);
  const contact = () => {
    setInApp(false);
    requestAnimationFrame(() =>
      document
        .getElementById("contact")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  if (!ready) return null;
  return (
    <LocaleContext.Provider value={{ lang, setLang, copy: translations[lang] }}>
      <div className="min-h-screen bg-[#f7f7f5]">
        {!inApp ? (
          <Landing explore={exploreExample} />
        ) : (
          <>
            <Sidebar
              view={view}
              setView={setView}
              routes={routes}
              selected={selected}
              selectRoute={(id) => {
                setSelected(id);
                setView("Routes");
              }}
              showRoutes={() => {
                setSelected(undefined);
                setView("Routes");
              }}
              opportunities={opportunities}
              selectOpportunity={(id) => {
                setView("Opportunities");
                setTimeout(() => {
                  document
                    .getElementById(`opportunity-${id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              reset={reset}
              contact={contact}
              isExample={isExample}
            />
            <main className="ml-[250px] min-h-screen">
              {view === "Routes" && (
                <Routes
                  routes={routes}
                  selectedId={selected}
                  setSelected={setSelected}
                  updateRoute={(updated) => {
                    const next = routes.map((route) =>
                      route.id === updated.id ? updated : route,
                    );
                    setRoutes(next);
                    persist({
                      company,
                      files,
                      integrations,
                      opportunities,
                      routes: next,
                    });
                  }}
                  removeRoute={deleteRoute}
                  showOpportunities={() => setView("Opportunities")}
                />
              )}
              {view === "Opportunities" && (
                <OpportunityList
                  opportunities={opportunities}
                  creating={creating}
                  create={createRoute}
                  remove={deleteOpportunity}
                  addSource={() => setView("Sources")}
                  createManual={createManualOpportunity}
                />
              )}
              {view === "Sources" && (
                <Sources
                  company={company}
                  files={files}
                  integrations={integrations}
                  onGenerate={() => void complete(company, files, integrations)}
                  onUpdateProfile={(next) => updateWorkspace({ company: next })}
                  onUpdateFiles={(next) => updateWorkspace({ files: next })}
                  onUpdateIntegrations={(next) =>
                    updateWorkspace({ integrations: next })
                  }
                />
              )}
            </main>
          </>
        )}
      </div>
    </LocaleContext.Provider>
  );
}
