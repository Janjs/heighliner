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
  Settings02Icon,
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
type Lang = "en" | "es";
type Company = {
  name: string;
  description: string;
  size: string;
  departments: string;
  processes: string;
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
};
type FlowData = {
  label: string;
  detail: string;
  kind: "system" | "ai" | "knowledge" | "logic" | "human";
  status?: "idle" | "running" | "done";
};

const spring = { type: "spring" as const, bounce: 0, duration: 0.38 };
const integrationNames = [
  "Gmail",
  "Google Drive",
  "Slack",
  "Microsoft 365",
  "Salesforce",
  "Notion",
  "HubSpot",
];
const defaults: Company = {
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
type Copy = {
  languageName: string;
  switchLanguage: string;
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
    setup: string;
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
    switchLanguage: "Español",
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
      setup: "Company setup",
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
      pastExecutions: "Past executions",
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
    switchLanguage: "English",
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
      setup: "Configuración de la empresa",
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
      pastExecutions: "Ejecuciones anteriores",
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

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-6 w-6 rounded-full bg-[#191918]">
        <div className="absolute left-[5px] top-[11px] h-px w-3 -rotate-[28deg] bg-[#ff7a35]" />
        <div className="absolute right-[5px] top-[5px] h-1.5 w-1.5 rounded-full bg-white" />
      </div>
      <span className="text-[17px] font-semibold tracking-[-.035em]">
        Heighliner
      </span>
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
  const { lang, setLang, copy } = useLocale();
  const nextLang = lang === "en" ? "es" : "en";
  return (
    <button
      type="button"
      onClick={() => setLang(nextLang)}
      className="pressable fixed right-4 top-4 z-[60] rounded-full border border-black/10 bg-white/85 px-3.5 py-2 text-[11px] font-medium text-[#292927] shadow-[0_10px_30px_rgba(0,0,0,.08)] backdrop-blur-xl"
      aria-label={
        lang === "en"
          ? `Switch language to ${translations.es.languageName}`
          : `Cambiar idioma a ${translations.en.languageName}`
      }
    >
      {lang === "en" ? "EN" : "ES"} · {copy.switchLanguage}
    </button>
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

function Onboarding({
  onComplete,
}: {
  onComplete: (
    company: Company,
    files: SourceFile[],
    integrations: string[],
  ) => void;
}) {
  const { copy } = useLocale();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(defaults);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const raw = localStorage.getItem("heighliner-onboarding-draft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      setCompany(draft.company || defaults);
      setFiles(draft.files || []);
      setConnected(draft.connected || []);
      setStep(draft.step || 0);
    } catch {}
  }, []);
  const field = (key: keyof Company, value: string) =>
    setCompany((c) => ({ ...c, [key]: value }));
  const addFiles = (list: FileList | null) =>
    list &&
    setFiles((current) =>
      [
        ...current,
        ...Array.from(list).map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      ].filter((v, i, a) => a.findIndex((x) => x.name === v.name) === i),
    );
  const connect = async (name: string) => {
    if (connected.includes(name)) {
      setConnected((v) => v.filter((x) => x !== name));
      return;
    }
    const next = [...connected, name];
    setConnected(next);
    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration: name }),
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.redirectUrl) {
        localStorage.setItem(
          "heighliner-onboarding-draft",
          JSON.stringify({ company, files, connected: next, step: 1 }),
        );
        window.location.assign(result.redirectUrl);
      }
    } catch {}
  };
  const canContinue =
    step === 0
      ? company.name.trim() && company.description.trim()
      : connected.length > 0 || files.length > 0;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f7f5]">
      <LanguageSwitcher />
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-6 py-5 lg:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-[12px] text-[#8b8b86]">
            {copy.onboarding.progress(step + 1)}
          </span>
        </div>
        <div className="mx-auto my-auto w-full max-w-[900px] py-10">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div
                key="context"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={spring}
              >
                <div className="max-w-[610px]">
                  <div className="mb-4 text-[13px] font-medium text-[#e45e20]">
                    {copy.onboarding.introTag}
                  </div>
                  <h1 className="text-[46px] font-semibold leading-[1.04] tracking-[-.055em]">
                    {copy.onboarding.introTitle}
                  </h1>
                  <p className="mt-5 max-w-lg text-[15px] leading-6 text-[#71716c]">
                    {copy.onboarding.introDescription}
                  </p>
                  <button
                    onClick={() =>
                      onComplete(
                        exampleCompany,
                        exampleFiles,
                        exampleIntegrations,
                      )
                    }
                    className="pressable mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#555550] hover:text-black"
                  >
                    {copy.onboarding.introExplore}{" "}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                  </button>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <TextField
                    label={copy.onboarding.companyName}
                    value={company.name}
                    onChange={(v) => field("name", v)}
                    placeholder={copy.onboarding.companyPlaceholder}
                  />
                  <TextField
                    label={copy.onboarding.teamSize}
                    value={company.size}
                    onChange={(v) => field("size", v)}
                    select
                    selectOptions={copy.onboarding.teamSizes}
                  />
                  <TextField
                    wide
                    label={copy.onboarding.companyDoes}
                    value={company.description}
                    onChange={(v) => field("description", v)}
                    placeholder={copy.onboarding.companyDescriptionPlaceholder}
                  />
                  <TextField
                    label={copy.onboarding.departments}
                    value={company.departments}
                    onChange={(v) => field("departments", v)}
                    placeholder={copy.onboarding.departmentsPlaceholder}
                  />
                  <TextField
                    label={copy.onboarding.processes}
                    value={company.processes}
                    onChange={(v) => field("processes", v)}
                    placeholder={copy.onboarding.processesPlaceholder}
                  />
                  <TextField
                    wide
                    label={copy.onboarding.bottlenecks}
                    value={company.bottlenecks}
                    onChange={(v) => field("bottlenecks", v)}
                    placeholder={copy.onboarding.bottlenecksPlaceholder}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sources"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 14 }}
                transition={spring}
              >
                <div className="max-w-[620px]">
                  <div className="mb-4 text-[13px] font-medium text-[#e45e20]">
                    {copy.onboarding.sourcesTag}
                  </div>
                  <h1 className="text-[46px] font-semibold leading-[1.04] tracking-[-.055em]">
                    {copy.onboarding.sourcesTitle}
                  </h1>
                  <p className="mt-5 text-[15px] leading-6 text-[#71716c]">
                    {copy.onboarding.sourcesDescription}
                  </p>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
                  <div>
                    <h2 className="mb-3 text-[13px] font-semibold">
                      {copy.onboarding.companyKnowledge}
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
                      className="pressable flex h-[126px] w-full flex-col items-center justify-center rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_35px_rgba(0,0,0,.035)]"
                    >
                      <HugeiconsIcon icon={Upload01Icon} size={19} />
                      <span className="mt-3 text-[12px] font-medium">
                        {copy.onboarding.uploadTitle}
                      </span>
                      <span className="mt-1 text-[10px] text-[#92928d]">
                        {copy.onboarding.uploadHint}
                      </span>
                    </button>
                    <div className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <div
                          key={f.name}
                          className="flex items-center gap-3 rounded-[14px] bg-white px-3 py-2.5"
                        >
                          <HugeiconsIcon
                            icon={File01Icon}
                            size={14}
                            className="text-[#777772]"
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px]">
                            {f.name}
                          </span>
                          <span className="text-[9px] text-[#999994]">
                            {Math.max(1, Math.round(f.size / 1024))} KB
                          </span>
                          <button
                            onClick={() =>
                              setFiles((v) => v.filter((_, x) => x !== i))
                            }
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="mb-3 text-[13px] font-semibold">
                      {copy.onboarding.systems}
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {integrationNames.map((name) => {
                        const active = connected.includes(name);
                        return (
                          <button
                            key={name}
                            onClick={() => connect(name)}
                            className={`pressable flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-left transition ${active ? "bg-[#232321] text-white shadow-lg shadow-black/10" : "bg-white hover:bg-[#fdfdfc]"}`}
                          >
                            <SystemMark name={name} />
                            <span className="text-[12px] font-medium">
                              {name}
                            </span>
                            {active ? (
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                className="ml-auto text-[#75cb8a]"
                                size={15}
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={Add01Icon}
                                className="ml-auto text-[#aaa9a4]"
                                size={14}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-[#92928d]">
                      {copy.onboarding.localConnections}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between border-t border-black/[.06] pt-5">
          <button
            onClick={() => setStep(0)}
            className={`pressable flex items-center gap-2 text-[12px] font-medium ${step === 0 ? "invisible" : ""}`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            {copy.onboarding.back}
          </button>
          <Button
            disabled={!canContinue}
            onClick={() =>
              step === 0 ? setStep(1) : onComplete(company, files, connected)
            }
          >
            {step === 0 ? (
              <>
                {copy.onboarding.continue}{" "}
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </>
            ) : (
              <>
                <HugeiconsIcon icon={SparklesIcon} size={14} />{" "}
                {copy.onboarding.findOpportunities}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
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
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block text-[12px] font-medium">{label}</span>
      {select ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-[14px] bg-white px-4 text-[13px] outline-none ring-[#ff7a35] focus:ring-2"
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
          className="h-12 w-full rounded-[14px] bg-white px-4 text-[13px] outline-none ring-[#ff7a35] placeholder:text-[#aaa9a5] focus:ring-2"
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
}) {
  const { copy } = useLocale();
  const [routesOpen, setRoutesOpen] = useState(true);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col bg-white/65 px-3 py-5 backdrop-blur-2xl">
      <div className="px-3">
        <Logo />
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
      <div className="mt-auto">
        <button
          onClick={reset}
          className="pressable flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-[11px] text-[#777772] hover:bg-black/[.04]"
        >
          <HugeiconsIcon icon={Settings02Icon} size={14} />
          {copy.nav.setup}
        </button>
      </div>
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
  const labels = [
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
}: {
  routes: RouteData[];
  selectedId?: string;
  setSelected: (id?: string) => void;
}) {
  const { copy, lang } = useLocale();
  const selected = routes.find((r) => r.id === selectedId);
  const [step, setStep] = useState(0);
  const [inspected, setInspected] = useState<Node<FlowData> | null>(null);
  const [review, setReview] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<number>();
  const [historyWidth, setHistoryWidth] = useState(300);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>();
  const [executions, setExecutions] = useState<
    { id: string; time: string; duration: string; reviewed: boolean }[]
  >([]);
  const selectedExecution = executions.find(
    (execution) => execution.id === selectedExecutionId,
  );
  const executionCopy =
    lang === "es"
      ? {
          title: "Detalle de ejecución",
          summary: "Resultado",
          created: "Pedido #1842 creado en Salesforce",
          steps: "Pasos completados",
          review: "BCN-GAUDI-03 confirmado durante la revisión humana",
        }
      : {
          title: "Execution detail",
          summary: "Result",
          created: "Order #1842 created in Salesforce",
          steps: "Completed steps",
          review: "BCN-GAUDI-03 confirmed during human review",
        };
  const flow = useMemo(
    () => (selected ? makeFlow(selected, lang) : null),
    [selected, lang],
  );
  useEffect(() => {
    setStep(0);
    setReview(false);
    setInspected(null);
    setRunStartedAt(undefined);
    setSelectedExecutionId(undefined);
    setExecutions(
      selected
        ? [
            {
              id: `${selected.id}-1`,
              time: lang === "es" ? "Hoy, 09:42" : "Today, 09:42",
              duration: "1m 34s",
              reviewed: false,
            },
            {
              id: `${selected.id}-2`,
              time: lang === "es" ? "Ayer, 16:18" : "Yesterday, 16:18",
              duration: "2m 06s",
              reviewed: true,
            },
            {
              id: `${selected.id}-3`,
              time: lang === "es" ? "Ayer, 11:03" : "Yesterday, 11:03",
              duration: "1m 41s",
              reviewed: false,
            },
            {
              id: `${selected.id}-4`,
              time: lang === "es" ? "8 ago, 17:25" : "Aug 8, 17:25",
              duration: "1m 52s",
              reviewed: false,
            },
          ]
        : [],
    );
  }, [selected?.id, lang]);
  useEffect(() => {
    if (step !== 8 || !runStartedAt) return;
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
  }, [step, runStartedAt, copy.routes.justNow]);
  useEffect(() => {
    if (!step || step >= 8 || review) return;
    if (step === 5) {
      setReview(true);
      return;
    }
    const timer = setTimeout(() => setStep((v) => v + 1), 760);
    return () => clearTimeout(timer);
  }, [step, review]);
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
          title={copy.routes.title}
          subtitle={copy.routes.subtitle(routes.length)}
        />
        <div className="mx-auto max-w-[1040px] px-8 py-10 lg:px-10">
          <div className="mb-8">
            <h2 className="text-[34px] font-semibold tracking-[-.05em]">
              {copy.routes.overviewTitle}
            </h2>
            <p className="mt-2 text-[13px] text-[#81817c]">
              {copy.routes.overviewDescription}
            </p>
          </div>
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
              disabled={step > 0 && step < 8}
            >
              {step > 0 && step < 8 ? (
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
                className={`h-2 w-2 rounded-full ${step >= 8 ? "bg-[#57a26b]" : "animate-pulse bg-[#ff7a35]"}`}
              />
              {step >= 8
                ? copy.routes.routeComplete
                : review
                  ? copy.routes.waitingForReview
                  : copy.routes.stepProgress(step, 7)}
            </motion.div>
          )}
          {review && (
            <ReviewSheet
              continueRoute={() => {
                setReview(false);
                setStep(6);
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
      <aside className="h-screen overflow-y-auto bg-white/55 px-5 py-6 backdrop-blur-xl">
        <AnimatePresence mode="wait" initial={false}>
          {selectedExecution ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={spring}
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={spring}
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
                {executions.map((execution, index) => (
                  <motion.button
                    key={execution.id}
                    onClick={() => setSelectedExecutionId(execution.id)}
                    initial={{ opacity: 0, y: index === 0 ? -5 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
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
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                <Button
                  secondary
                  onClick={() => setEditingProfile(false)}
                >
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
  const [onboarding, setOnboarding] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<View>("Routes");
  const [company, setCompany] = useState<Company>(defaults);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selected, setSelected] = useState<string>();
  const [creating, setCreating] = useState<string | null>(null);
  useEffect(() => {
    const storedLang = localStorage.getItem("heighliner-language");
    const browserLang = navigator.language.toLowerCase().startsWith("es")
      ? "es"
      : "en";
    const initialLang =
      storedLang === "en" || storedLang === "es" ? storedLang : browserLang;
    setLang(initialLang);
    document.documentElement.lang = initialLang;

    const raw = localStorage.getItem("heighliner-workspace");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setCompany(data.company || defaults);
        setFiles(data.files || []);
        setIntegrations(data.integrations || []);
        setOpportunities(data.opportunities || []);
        setRoutes(data.routes || []);
        setSelected(undefined);
      } catch {}
    } else setOnboarding(true);
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
    localStorage.removeItem("heighliner-onboarding-draft");
    setCompany(nextCompany);
    setFiles(nextFiles);
    setIntegrations(nextIntegrations);
    setOnboarding(false);
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
  const createRoute = (o: Opportunity) => {
    setCreating(o.id);
    setTimeout(() => {
      const route: RouteData = {
        id: `route-${Date.now()}`,
        title: o.title,
        description: o.description,
        hours: o.hours,
        systems: o.systems,
        createdAt: Date.now(),
      };
      const next = [route, ...routes];
      setRoutes(next);
      setSelected(route.id);
      setCreating(null);
      setView("Routes");
      persist({ company, files, integrations, opportunities, routes: next });
    }, 650);
  };
  const reset = () => setOnboarding(true);
  if (!ready) return null;
  return (
    <LocaleContext.Provider value={{ lang, setLang, copy: translations[lang] }}>
      <div className="min-h-screen bg-[#f7f7f5]">
        <AnimatePresence>
          {onboarding && <Onboarding onComplete={complete} />}
        </AnimatePresence>
        {!onboarding && (
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
            />
            <main className="ml-[250px] min-h-screen">
              {view === "Routes" && (
                <Routes
                  routes={routes}
                  selectedId={selected}
                  setSelected={setSelected}
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
