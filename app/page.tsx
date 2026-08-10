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
  Cancel01Icon,
  CheckIcon,
  CheckmarkCircle02Icon,
  ChevronRightIcon,
  CircleIcon,
  Database01Icon,
  File01Icon,
  FolderOpenIcon,
  GitBranchIcon,
  InboxIcon,
  Loading01Icon,
  Mail01Icon,
  PlayIcon,
  Route01Icon,
  SparklesIcon,
  Upload01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
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

type View = "Routes" | "Opportunities" | "Sources";
type Lang = "en" | "es" | "nl";

const languageLabels: Record<Lang, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};

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

const executionTimesByLang = {
  en: ["Today, 09:42", "Yesterday, 16:18", "Yesterday, 11:03", "Aug 8, 17:25"],
  es: ["Hoy, 09:42", "Ayer, 16:18", "Ayer, 11:03", "8 ago, 17:25"],
  nl: ["Vandaag, 09:42", "Gisteren, 16:18", "Gisteren, 11:03", "8 aug, 17:25"],
} satisfies Record<Lang, [string, string, string, string]>;

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
};
type RouteData = {
  id: string;
  title: string;
  description: string;
  hours: number;
  systems: string[];
  createdAt: number;
  steps?: RouteStep[];
};
type RouteStep = Pick<FlowData, "label" | "detail" | "kind">;
type FlowData = {
  label: string;
  detail: string;
  kind: "system" | "ai" | "knowledge" | "logic" | "human";
  status?: "idle" | "running" | "done";
};

const spring = { type: "spring" as const, bounce: 0, duration: 0.38 };
const panelTransition = {
  type: "tween" as const,
  duration: 0.12,
  ease: [0.25, 0.1, 0.25, 1] as const,
};
const integrationNames = [
  "Gmail",
  "Google Drive",
  "Slack",
  "Microsoft 365",
  "Salesforce",
  "Notion",
  "HubSpot",
];
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
    "Orders arrive in different formats and products are matched manually",
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
const exampleIntegrations = ["Gmail", "Google Drive", "Salesforce"];
const exampleOpportunities: Opportunity[] = [
  {
    id: "opp-orders",
    title: "Automate incoming orders",
    description:
      "Extract retailer orders from email and PDF attachments, match products against the catalogue, and create clean records in Salesforce.",
    evidence:
      "Order processing SOP.pdf · Orders arrive in different formats and products are matched manually",
    hours: 8,
    impact: "High",
    effort: "Low",
    confidence: 94,
    systems: ["Gmail", "Company knowledge", "Salesforce"],
  },
  {
    id: "opp-catalogue",
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
      "Cross-check incoming orders against active retailer accounts and flag orders from unknown or inactive shops.",
    evidence:
      "Retailer accounts.csv · New shops occasionally order before onboarding is complete",
    hours: 4,
    impact: "High",
    effort: "Medium",
    confidence: 88,
    systems: ["Gmail", "Salesforce"],
  },
  {
    id: "opp-packing",
    title: "Generate packing lists",
    description:
      "Consolidate confirmed orders into warehouse packing lists grouped by delivery route and pallet size.",
    evidence:
      "Order processing SOP.pdf · Operations team builds packing lists by hand each afternoon",
    hours: 3,
    impact: "Medium",
    effort: "Medium",
    confidence: 85,
    systems: ["Salesforce", "Google Drive"],
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
      label: "Update catalogue alias",
      detail: "Save confirmed mapping as a retailer-specific alias",
      kind: "system",
    },
  ],
  "opp-accounts": [
    {
      label: "Gmail",
      detail: "Detect retailer name and email from incoming order",
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
      label: "Oversized order",
      detail: "Split orders that exceed single-pallet limits",
      kind: "logic",
    },
    {
      label: "Google Drive",
      detail: "Write formatted packing list for warehouse team",
      kind: "system",
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
const exampleRoutes: RouteData[] = [
  {
    id: "example-route-orders",
    title: "Automate incoming orders",
    description:
      "Extract retailer orders from email and PDF attachments, match products against the catalogue, and create clean records in Salesforce.",
    hours: 8,
    systems: ["Gmail", "Company knowledge", "Salesforce"],
    createdAt: 1,
  },
  {
    id: "example-route-catalogue",
    title: "Match products to catalogue",
    description:
      "Map free-text product descriptions from retailer orders to SKU entries in the product catalogue spreadsheet.",
    hours: 5,
    systems: ["Google Drive", "Company knowledge"],
    createdAt: 2,
    steps: exampleRouteSteps["opp-catalogue"],
  },
  {
    id: "example-route-accounts",
    title: "Validate retailer accounts",
    description:
      "Cross-check incoming orders against active retailer accounts and flag orders from unknown or inactive shops.",
    hours: 4,
    systems: ["Gmail", "Salesforce"],
    createdAt: 3,
    steps: exampleRouteSteps["opp-accounts"],
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
    tag: string;
    heading: (count: number) => string;
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
    reviewStatus: string;
    justNow: string;
    stepProgress: (step: number, total: number) => string;
    activeRoutes: (count: number) => string;
  };
  review: {
    tag: string;
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
      localConnections:
        "Prototype connections are stored locally. Production OAuth can be activated with Composio credentials.",
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
      tag: "Discovery complete",
      heading: (count) => `${count} valuable routes found.`,
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
      reviewStatus: "Reviewed",
      justNow: "Just now",
      stepProgress: (step, total) => `Running step ${step} of ${total}`,
      activeRoutes: (count) =>
        `${count} active ${count === 1 ? "route" : "routes"}`,
    },
    review: {
      tag: "Human checkpoint",
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
        "Las conexiones de prueba se guardan localmente. El OAuth de producción puede activarse con credenciales de Composio.",
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
      tag: "Descubrimiento completo",
      heading: (count) => `Se encontraron ${count} rutas valiosas.`,
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
      reviewStatus: "Revisada",
      justNow: "Ahora mismo",
      stepProgress: (step, total) => `Ejecutando paso ${step} de ${total}`,
      activeRoutes: (count) =>
        `${count} ruta${count === 1 ? "" : "s"} activa${count === 1 ? "" : "s"}`,
    },
    review: {
      tag: "Punto de revisión humana",
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
        "Prototypeverbindingen worden lokaal opgeslagen. Productie-OAuth kan worden geactiveerd met Composio-credentials.",
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
      tag: "Ontdekking voltooid",
      heading: (count) => `${count} waardevolle routes gevonden.`,
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
      reviewStatus: "Beoordeeld",
      justNow: "Zojuist",
      stepProgress: (step, total) => `Stap ${step} van ${total} uitvoeren`,
      activeRoutes: (count) =>
        `${count} actieve ${count === 1 ? "route" : "routes"}`,
    },
    review: {
      tag: "Menselijk controlepunt",
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
      <div className="relative h-6 w-6 rounded-full bg-[#191918]">
        <div className="absolute left-[5px] top-[11px] h-px w-3 -rotate-[28deg] bg-[#ff7a35]" />
        <div className="absolute right-[5px] top-[5px] h-1.5 w-1.5 rounded-full bg-white" />
      </div>
      <span className="text-[17px] font-semibold tracking-[-.035em]">
        Heighliner
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="pressable flex items-center gap-2.5"
      >
        {mark}
      </button>
    );
  }

  return <div className="flex items-center gap-2.5">{mark}</div>;
}

type LandingCopy = {
  navContact: string;
  eyebrow: string;
  title: string;
  body: string;
  contactButton: string;
  demo: string;
  previewTag: string;
  previewTitle: string;
  opportunity: string;
  opportunityBody: string;
  saved: string;
  routeTag: string;
  routeTitle: string;
  steps: [string, string][];
  contactTag: string;
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
  exampleTag: string;
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
    eyebrow: "Practical AI for operations",
    title: "Turn repetitive work into intelligent routes.",
    body: "You don’t need to know what to automate. Tell Heighliner how your company works and it will find the opportunities for you.",
    contactButton: "Tell us about your company",
    demo: "View an example",
    previewTag: "your company workspace",
    previewTitle: "6 valuable routes found",
    opportunity: "Automate incoming orders",
    opportunityBody:
      "Extract orders, validate products, and create clean records in Salesforce.",
    saved: "8h saved / week",
    routeTag: "From interview to automation",
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
    contactTag: "Start with context, not an automation idea",
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
    exampleTag: "Want to see it first?",
    exampleTitle: "See how it worked for a small souvenir company in Spain.",
    exampleBody:
      "Explore a real workspace, the opportunities Heighliner found, and the routes it built.",
    exampleButton: "View the Amazonik example",
    note: "AI automation discovery, design, and implementation.",
    preview: {
      navRoutes: "Routes",
      navOpportunities: "Opportunities",
      navSources: "Sources",
      headerTitle: "Opportunities",
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
    eyebrow: "IA práctica para operaciones",
    title: "Convierte el trabajo repetitivo en rutas inteligentes.",
    body: "No tienes que saber qué automatizar. Cuéntale a Heighliner cómo funciona tu empresa y encontrará las oportunidades por ti.",
    contactButton: "Cuéntanos sobre tu empresa",
    demo: "Ver un ejemplo",
    previewTag: "Espacio de trabajo de tu empresa",
    previewTitle: "6 rutas valiosas encontradas",
    opportunity: "Automatizar pedidos entrantes",
    opportunityBody:
      "Extrae pedidos, valida productos y crea registros limpios en Salesforce.",
    saved: "8 h ahorradas / semana",
    routeTag: "De la entrevista a la automatización",
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
    contactTag: "Empieza con contexto, no con una idea de automatización",
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
    exampleTag: "¿Prefieres verlo primero?",
    exampleTitle:
      "Mira cómo funcionó para una pequeña empresa de souvenirs en España.",
    exampleBody:
      "Explora un espacio de trabajo real, las oportunidades que encontró Heighliner y las rutas que construyó.",
    exampleButton: "Ver el ejemplo de Amazonik",
    note: "Descubrimiento, diseño e implementación de automatizaciones con IA.",
    preview: {
      navRoutes: "Rutas",
      navOpportunities: "Oportunidades",
      navSources: "Fuentes",
      headerTitle: "Oportunidades",
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
    eyebrow: "Praktische AI voor operations",
    title: "Maak repetitief werk slimme routes.",
    body: "Je hoeft niet te weten wat je moet automatiseren. Vertel Heighliner hoe je bedrijf werkt en het vindt de kansen voor je.",
    contactButton: "Vertel ons over je bedrijf",
    demo: "Bekijk een voorbeeld",
    previewTag: "Werkruimte van je bedrijf",
    previewTitle: "6 waardevolle routes gevonden",
    opportunity: "Inkomende orders automatiseren",
    opportunityBody:
      "Haal orders eruit, valideer producten en maak schone records in Salesforce.",
    saved: "8 uur bespaard / week",
    routeTag: "Van interview tot automatisering",
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
    contactTag: "Begin met context, niet met een automatiseringsidee",
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
    exampleTag: "Eerst even kijken?",
    exampleTitle:
      "Bekijk hoe het werkte voor een klein souvenirbedrijf in Spanje.",
    exampleBody:
      "Verken een echte werkruimte, de kansen die Heighliner vond en de routes die het bouwde.",
    exampleButton: "Bekijk het Amazonik-voorbeeld",
    note: "Ontdekking, ontwerp en implementatie van AI-automatisering.",
    preview: {
      navRoutes: "Routes",
      navOpportunities: "Kansen",
      navSources: "Bronnen",
      headerTitle: "Kansen",
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
  subtitleHref,
  logoSrc,
  logoAlt = "",
}: {
  compact?: boolean;
  name?: string;
  subtitle?: string;
  subtitleHref?: string;
  logoSrc?: string;
  logoAlt?: string;
}) {
  return (
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
          subtitleHref ? (
            <a
              href={subtitleHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`block truncate text-[#999994] hover:text-[#555550] ${compact ? "text-[9px]" : "text-[10px]"}`}
            >
              {subtitle}
            </a>
          ) : (
            <div
              className={`truncate text-[#999994] ${compact ? "text-[9px]" : "text-[10px]"}`}
            >
              {subtitle}
            </div>
          )
        ) : null}
      </div>
    </div>
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
      <header className="mx-auto flex h-20 w-full max-w-[1180px] items-center justify-between">
        <Logo />
        <div className="flex items-center gap-5">
          <LanguageSwitcher />
          <a
            href="#contact"
            className="pressable text-[12px] font-medium text-[#696964] hover:text-black"
          >
            {copy.navContact}
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] pb-24 sm:pb-32">
        <section className="pb-16 pt-24 text-center sm:pb-24 sm:pt-32">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#df6027]">
            {copy.eyebrow}
          </p>
          <h1 className="mx-auto mt-6 max-w-[920px] text-[clamp(3.3rem,8vw,7.4rem)] font-semibold leading-[.9] tracking-[-.075em]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-7 max-w-[590px] text-[15px] leading-7 text-[#6f6f6a] sm:text-[17px]">
            {copy.body}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="pressable inline-flex items-center gap-2 rounded-full bg-[#20201f] px-5 py-3 text-[13px] font-medium text-white hover:bg-black"
            >
              {copy.contactButton}
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </a>
            <button
              onClick={explore}
              className="pressable inline-flex items-center gap-2 rounded-full bg-black/[.055] px-5 py-3 text-[13px] font-medium hover:bg-black/[.09]"
            >
              {copy.demo}
            </button>
          </div>
        </section>

        <section
          aria-label="Heighliner dashboard preview"
          className="relative mt-6 pb-24 sm:mt-10 sm:pb-32"
        >
          <div className="absolute inset-x-[12%] bottom-0 h-2/3 rounded-full bg-[#ff7a35]/15 blur-[100px]" />
          <div className="relative rounded-[28px] border border-black/[.08] bg-[#e9e9e6] p-2 shadow-[0_35px_100px_rgba(27,27,25,.14)] sm:rounded-[36px] sm:p-3">
            <div className="grid min-h-[540px] overflow-hidden rounded-[22px] bg-[#f7f7f5] sm:rounded-[28px] md:grid-cols-[190px_1fr]">
              <aside className="hidden min-h-full flex-col border-r border-black/[.06] bg-white/70 p-5 md:flex">
                <Logo />
                <div className="mt-9 space-y-1 text-[11px]">
                  {[
                    [Route01Icon, copy.preview.navRoutes],
                    [SparklesIcon, copy.preview.navOpportunities],
                    [Database01Icon, copy.preview.navSources],
                  ].map(([icon, label], index) => (
                    <div
                      key={String(label)}
                      className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 ${index === 1 ? "bg-black/[.06] font-medium" : "text-[#777772]"}`}
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
                <div className="p-5 sm:p-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#df6027]">
                    {copy.preview.discoveryComplete}
                  </p>
                  <h2 className="mt-3 text-[27px] font-semibold tracking-[-.05em] sm:text-[34px]">
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
                          Gmail <span className="text-[#bbb]">→</span>{" "}
                          Salesforce
                        </span>
                        <span className="text-[10px] font-semibold">
                          {copy.saved}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-[20px] bg-[#20201f] p-5 text-white">
                      <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-white/45">
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
        </section>

        <section className="border-t border-black/[.08] py-24 sm:py-32">
          <h2 className="max-w-3xl text-[18px] font-medium leading-7 tracking-[-.02em] text-[#555550] sm:text-[20px]">
            {copy.routeTitle}
          </h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.12fr_.88fr] lg:items-stretch">
            <div className="min-h-[500px] overflow-hidden rounded-[30px] bg-[#20201f] p-6 text-white sm:p-8">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#ff8a4d]">
                  0{activeJourney + 1} · {copy.steps[activeJourney][0]}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#6fc783] shadow-[0_0_0_5px_rgba(111,199,131,.1)]" />
              </div>

              <div key={activeJourney} className="landing-journey-visual">
                {activeJourney === 0 && (
                  <div className="grid h-[410px] place-items-center">
                    <div className="grid w-full max-w-[520px] grid-cols-[1fr_56px_1.1fr] items-center gap-y-3">
                      {["Gmail", "Google Drive", "Salesforce"].map(
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
                                  {translations[lang].sources.companyKnowledge}
                                </p>
                                <p className="mt-2 text-[9px] leading-4 text-white/45">
                                  {translations[lang].sources.connectedSystems}
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
                          "Gmail",
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
                              <HugeiconsIcon
                                icon={icon as typeof Route01Icon}
                                size={14}
                              />
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
                        ].map(([icon, title, detail, tone], index) => (
                          <div
                            key={String(title)}
                            className="landing-result-card relative z-10 flex min-w-0 items-center gap-2.5 rounded-[17px] border border-white/10 bg-[#2c2c2a] p-3 text-white shadow-[0_1px_2px_rgba(0,0,0,.12),0_8px_22px_rgba(0,0,0,.18)]"
                            style={{ animationDelay: `${(index + 3) * 55}ms` }}
                          >
                            <span
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${String(tone)}`}
                            >
                              <HugeiconsIcon
                                icon={icon as typeof Route01Icon}
                                size={14}
                              />
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
                        ))}
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
                    0{index + 1}
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
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#df6027]">
                {copy.contactTag}
              </p>
              <h2 className="mt-5 max-w-[560px] text-[clamp(2.8rem,5vw,5.4rem)] font-semibold leading-[.94] tracking-[-.065em]">
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
                        <HugeiconsIcon
                          icon={Loading01Icon}
                          size={14}
                          className="animate-spin"
                        />
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
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#ff8a4d]">
            {copy.exampleTag}
          </p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
            <h2 className="max-w-[760px] text-[clamp(2.6rem,5vw,5.5rem)] font-semibold leading-[.94] tracking-[-.065em]">
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
                <button
                  onClick={explore}
                  className="pressable inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-medium text-[#20201f]"
                >
                  {copy.exampleButton}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
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

function SystemMark({ name }: { name: string }) {
  const icon =
    name === "Gmail"
      ? Mail01Icon
      : name === "Google Drive"
        ? FolderOpenIcon
        : name === "Slack"
          ? InboxIcon
          : name === "Salesforce"
            ? Database01Icon
            : BoxesIcon;
  return (
    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-black/[.055] text-[#555550] [&_svg]:h-4 [&_svg]:w-4">
      <HugeiconsIcon icon={icon} />
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
  isExample,
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
  isExample?: boolean;
}) {
  const { copy } = useLocale();
  const [routesOpen, setRoutesOpen] = useState(true);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col bg-white/65 px-3 py-5 backdrop-blur-2xl">
      <div className="px-3">
        <Logo onClick={reset} />
      </div>
      <nav className="mt-8 space-y-1">
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
              <span className="truncate">{copy.nav.opportunities}</span>
              <span className="text-[11px] text-[#999994]">
                {opportunities.length}
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
      {isExample && (
        <div className="mt-auto px-3">
          <WorkspaceAccount
            name="Amazonik S.L."
            subtitle="amazonik.es"
            subtitleHref="https://amazonik.es"
            logoSrc={amazonikLogo}
            logoAlt="Amazonik logo"
          />
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
    <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between bg-[#f7f7f5]/82 px-8 backdrop-blur-xl lg:px-10">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={back}
            aria-label={backLabel}
            className="pressable grid h-9 w-9 place-items-center rounded-full bg-black/[.055] text-[#555550] hover:bg-black/[.08]"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          </button>
        )}
        <div>
          <h1 className="text-[19px] font-semibold tracking-[-.035em]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[11px] text-[#898984]">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}

function OpportunityList({
  opportunities,
  creating,
  create,
}: {
  opportunities: Opportunity[];
  creating: string | null;
  create: (o: Opportunity) => void;
}) {
  const { copy } = useLocale();
  return (
    <div>
      <ShellHeader
        title={copy.opportunities.title}
        subtitle={copy.opportunities.subtitle}
      />
      <div className="mx-auto max-w-[1120px] px-8 py-10 lg:px-10">
        <div className="mb-10">
          <span className="text-[12px] font-medium text-[#e45e20]">
            {copy.opportunities.tag}
          </span>
          <h2 className="mt-3 text-[38px] font-semibold tracking-[-.05em]">
            {copy.opportunities.heading(opportunities.length)}
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#777772]">
            {copy.opportunities.description}
          </p>
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            {opportunities.map((o, i) => (
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
                    <div>
                      <div className="text-[22px] font-semibold tracking-[-.045em]">
                        {o.hours}h
                      </div>
                      <div className="text-[9px] text-[#999994]">
                        {copy.opportunities.savedPerWeek}
                      </div>
                    </div>
                    <Button
                      disabled={creating === o.id}
                      onClick={() => create(o)}
                      className="mt-auto h-9 px-3.5 text-[11px]"
                    >
                      {creating === o.id ? (
                        <HugeiconsIcon
                          icon={Loading01Icon}
                          className="animate-spin"
                          size={13}
                        />
                      ) : (
                        <HugeiconsIcon icon={Add01Icon} size={13} />
                      )}{" "}
                      {copy.opportunities.createRoute}
                    </Button>
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
              {opportunities.map((opportunity, index) => {
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
      </div>
    </div>
  );
}

function FlowNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const Icon = {
    system: BoxesIcon,
    ai: BotIcon,
    knowledge: Database01Icon,
    logic: GitBranchIcon,
    human: UserCheck01Icon,
  }[data.kind];
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
          <HugeiconsIcon icon={Icon} size={14} />
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
          <HugeiconsIcon
            icon={Loading01Icon}
            size={14}
            className="ml-auto animate-spin text-[#e45e20]"
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function makeFlow(
  route: RouteData,
  lang: Lang,
): {
  nodes: Node<FlowData>[];
  edges: Edge[];
} {
  const flowCopy = translations[lang].flow;
  const system = route.systems[0] || "Gmail";
  const destination = route.systems.at(-1) || "Business system";
  const defaultSteps = [
    [system, flowCopy.newItem, "system"],
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
    ],
    [flowCopy.routeComplete, flowCopy.destinationReached, "system"],
  ] as const;
  const labels = route.steps?.length
    ? route.steps.map((step) => [step.label, step.detail, step.kind] as const)
    : defaultSteps;
  if (route.steps?.length) {
    const nodes: Node<FlowData>[] = labels.map((item, index) => ({
      id: String(index + 1),
      type: "flow",
      position: { x: 270, y: 20 + index * 125 },
      data: { label: item[0], detail: item[1], kind: item[2] },
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
  const positions = [
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
    data: { label: l[0], detail: l[1], kind: l[2] },
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
  return {
    nodes,
    edges: [
      mk("a", "1", "2"),
      mk("b", "2", "3"),
      mk("c", "3", "4"),
      mk("d", "4", "5", flowCopy.reviewEdge),
      mk("e", "4", "6", flowCopy.confidenceEdge),
      mk("f", "5", "7"),
      mk("g", "6", "7"),
    ],
  };
}

function Routes({
  routes,
  selectedId,
  setSelected,
  updateRoute,
}: {
  routes: RouteData[];
  selectedId?: string;
  setSelected: (id?: string) => void;
  updateRoute: (route: RouteData) => void;
}) {
  const { copy, lang } = useLocale();
  const selected = routes.find((r) => r.id === selectedId);
  const [step, setStep] = useState(0);
  const [inspected, setInspected] = useState<Node<FlowData> | null>(null);
  const [review, setReview] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number>();
  const [historyWidth, setHistoryWidth] = useState(360);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>();
  const [sideTab, setSideTab] = useState<"chat" | "history">("history");
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [executions, setExecutions] = useState<
    { id: string; time: string; duration: string; reviewed: boolean }[]
  >([]);
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
    setRunStartedAt(undefined);
    setSideTab("history");
    setChatInput("");
    setChatMessages([]);
    setSelectedExecutionId(undefined);
    setExecutions(
      selected
        ? executionTimesByLang[lang].map((time, index) => ({
            id: `${selected.id}-${index + 1}`,
            time,
            duration: ["1m 34s", "2m 06s", "1m 41s", "1m 52s"][index],
            reviewed: index === 1,
          }))
        : [],
    );
  }, [selected?.id, lang]);
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
  useEffect(() => {
    if (step !== completeStep || !runStartedAt) return;
    const id = String(runStartedAt);
    setExecutions((current) =>
      current.some((execution) => execution.id === id)
        ? current
        : [
            {
              id,
              time: copy.routes.justNow,
              duration: "1m 34s",
              reviewed: true,
            },
            ...current,
          ],
    );
  }, [step, completeStep, runStartedAt, copy.routes.justNow]);
  useEffect(() => {
    if (!step || step >= completeStep || review) return;
    if (flow?.nodes[step - 1]?.data.kind === "human") {
      setReview(true);
      return;
    }
    const timer = setTimeout(() => setStep((v) => v + 1), 760);
    return () => clearTimeout(timer);
  }, [step, completeStep, review, flow]);
  const nodes = useMemo(
    () =>
      flow?.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status:
            step > Number(n.id)
              ? ("done" as const)
              : step === Number(n.id)
                ? ("running" as const)
                : ("idle" as const),
        },
      })) || [],
    [flow, step],
  );
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
              <motion.button
                key={route.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: index * 0.04 }}
                onClick={() => setSelected(route.id)}
                className="pressable group rounded-[24px] bg-white p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,.03),0_12px_35px_rgba(0,0,0,.035)] transition-shadow hover:shadow-[0_2px_3px_rgba(0,0,0,.04),0_18px_45px_rgba(0,0,0,.06)]"
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
                      className={`grid h-8 w-8 place-items-center rounded-full bg-[#f0f0ed] text-[#666661] ring-2 ring-white [&_svg]:h-3.5 [&_svg]:w-3.5 ${systemIndex ? "-ml-1.5" : ""}`}
                      title={system}
                    >
                      {system === "Gmail" ? (
                        <HugeiconsIcon icon={Mail01Icon} />
                      ) : system === "Salesforce" ? (
                        <HugeiconsIcon icon={Database01Icon} />
                      ) : (
                        <HugeiconsIcon icon={BoxesIcon} />
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
                      {18 + index * 7}
                    </span>
                    <span className="text-[9px] text-[#92928d]">
                      {copy.routes.runsThisWeek}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold">
                      {96 - index}%
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
                <span className="mt-5 flex items-center justify-end gap-1 text-[10px] font-semibold text-[#686863] opacity-0 transition group-hover:opacity-100">
                  {copy.routes.openRoute}{" "}
                  <HugeiconsIcon icon={ChevronRightIcon} size={12} />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
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
            <Button
              onClick={() => {
                setInspected(null);
                setRunStartedAt(Date.now());
                setStep(1);
              }}
              disabled={step > 0 && step < completeStep}
            >
              {step > 0 && step < completeStep ? (
                <>
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    size={14}
                    className="animate-spin"
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
                <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#999994]">
                  {copy.flow.nodeKinds[inspected.data.kind]}
                </span>
                <h3 className="mt-3 text-[20px] font-semibold tracking-[-.035em]">
                  {inspected.data.label}
                </h3>
                <p className="mt-2 text-[12px] text-[#858580]">
                  {inspected.data.detail}
                </p>
                <div className="mt-8 rounded-[16px] bg-black/[.04] p-4">
                  <div className="text-[10px] font-medium">
                    {copy.flow.configuration}
                  </div>
                  <p className="mt-2 text-[10px] leading-5 text-[#777772]">
                    {copy.flow.usesConnectedAccount(selected.systems[0])}
                  </p>
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
                      <HugeiconsIcon
                        icon={Loading01Icon}
                        size={12}
                        className="animate-spin"
                      />
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
                      rows={1}
                      placeholder={chatCopy.placeholder}
                      className="max-h-28 min-h-8 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[11px] outline-none placeholder:text-[#aaa9a4]"
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
                <h2 className="mt-6 text-[18px] font-semibold tracking-[-.035em]">
                  {executionCopy.title}
                </h2>
                <div className="mt-4 rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.035)]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#3f7b50]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eaf4ec]">
                      <HugeiconsIcon icon={CheckIcon} size={12} />
                    </span>
                    {selectedExecution.reviewed
                      ? copy.routes.reviewStatus
                      : copy.routes.completedStatus}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[9px] text-[#92928d]">
                    <span>{selectedExecution.time}</span>
                    <span>{selectedExecution.duration}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#999994]">
                    {executionCopy.summary}
                  </div>
                  <div className="mt-2 rounded-[16px] bg-[#edf6ef] p-4 text-[11px] font-medium text-[#396c47]">
                    {executionCopy.created}
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#999994]">
                    {executionCopy.steps}
                  </div>
                  <div className="mt-3 space-y-3">
                    {flow!.nodes.map((node) => (
                      <div key={node.id} className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eaf4ec] text-[#4a8a5d]">
                          <HugeiconsIcon icon={CheckIcon} size={10} />
                        </span>
                        <span className="text-[10px] text-[#686863]">
                          {node.data.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <button
                      key={execution.id}
                      onClick={() => setSelectedExecutionId(execution.id)}
                      className="pressable w-full rounded-[16px] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,.035)] hover:bg-white/80"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[10px] font-semibold">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#eaf4ec] text-[#4a8a5d]">
                            <HugeiconsIcon icon={CheckIcon} size={11} />
                          </span>
                          {execution.reviewed
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
                        <span>{execution.time}</span>
                        <span>{execution.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
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
        <span className="text-[11px] font-medium text-[#e45e20]">
          {copy.review.tag}
        </span>
        <h3 className="mt-2 text-[23px] font-semibold tracking-[-.04em]">
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
              <span className="font-mono text-[11px] font-semibold">
                {item[0]}
              </span>
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

function Sources({
  company,
  files,
  integrations,
  onUpdateCompany,
  onUpdateFiles,
  onUpdateIntegrations,
}: {
  company: Company;
  files: SourceFile[];
  integrations: string[];
  onUpdateCompany: (company: Company) => void;
  onUpdateFiles: (files: SourceFile[]) => void;
  onUpdateIntegrations: (integrations: string[]) => void;
}) {
  const { copy } = useLocale();
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftCompany, setDraftCompany] = useState(company);
  const input = useRef<HTMLInputElement>(null);
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
  const connect = async (name: string) => {
    if (integrations.includes(name)) {
      onUpdateIntegrations(integrations.filter((x) => x !== name));
      return;
    }
    const next = [...integrations, name];
    onUpdateIntegrations(next);
    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration: name }),
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.redirectUrl) window.location.assign(result.redirectUrl);
    } catch {}
  };
  const startEditProfile = () => {
    setDraftCompany(company);
    setEditingProfile(true);
  };
  const saveProfile = () => {
    onUpdateCompany(draftCompany);
    setEditingProfile(false);
  };
  return (
    <div>
      <ShellHeader
        title={copy.sources.title}
        subtitle={copy.sources.subtitle}
      />
      <div className="mx-auto max-w-[920px] p-10">
        <section>
          <h2 className="text-[13px] font-semibold">
            {copy.sources.connectedSystems}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {integrationNames.map((name) => {
              const active = integrations.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => connect(name)}
                  className={`pressable flex items-center gap-3 rounded-[18px] p-4 text-left transition ${active ? "bg-[#232321] text-white shadow-lg shadow-black/10" : "bg-white hover:bg-[#fdfdfc]"}`}
                >
                  <SystemMark name={name} />
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
        </section>
        <section className="mt-10">
          <h2 className="text-[13px] font-semibold">
            {copy.sources.companyKnowledge}
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
                {copy.sources.noDocuments}
              </div>
            )}
          </div>
        </section>
        <section className="mt-10 rounded-[22px] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[13px] font-semibold">
              {editingProfile ? copy.onboarding.companyName : company.name}
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
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField
                label={copy.onboarding.companyName}
                value={draftCompany.name}
                onChange={(v) => field("name", v)}
                placeholder={copy.onboarding.companyPlaceholder}
              />
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
                placeholder={copy.onboarding.companyDescriptionPlaceholder}
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
            </div>
          ) : (
            <>
              <p className="mt-2 text-[12px] leading-5 text-[#777772]">
                {company.description}
              </p>
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
            </>
          )}
        </section>
      </div>
    </div>
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
        title: o.title,
        description: o.description,
        hours: o.hours,
        systems: o.systems,
        createdAt: Date.now(),
        ...(steps ? { steps } : {}),
      };
      const next = [route, ...routes];
      setRoutes(next);
      setSelected(route.id);
      setCreating(null);
      setView("Routes");
      persist({ company, files, integrations, opportunities, routes: next });
    }, 650);
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
                />
              )}
              {view === "Opportunities" && (
                <OpportunityList
                  opportunities={opportunities}
                  creating={creating}
                  create={createRoute}
                />
              )}
              {view === "Sources" && (
                <Sources
                  company={company}
                  files={files}
                  integrations={integrations}
                  onUpdateCompany={(next) => updateWorkspace({ company: next })}
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
