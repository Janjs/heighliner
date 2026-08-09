"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Database,
  File,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GitBranch,
  Inbox,
  Loader2,
  Mail,
  MoreHorizontal,
  Play,
  Plus,
  Route as RouteIcon,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
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

function SystemMark({ name }: { name: string }) {
  const icon =
    name === "Gmail" ? (
      <Mail />
    ) : name === "Google Drive" ? (
      <FolderOpen />
    ) : name === "Slack" ? (
      <Inbox />
    ) : name === "Salesforce" ? (
      <Database />
    ) : (
      <Boxes />
    );
  return (
    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-black/[.055] text-[#555550] [&_svg]:h-4 [&_svg]:w-4">
      {icon}
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
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-6 py-7 lg:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-[12px] text-[#8b8b86]">{step + 1} of 2</span>
        </div>
        <div className="mx-auto my-auto w-full max-w-[900px] py-16">
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
                    Let’s get oriented
                  </div>
                  <h1 className="text-[46px] font-semibold leading-[1.04] tracking-[-.055em]">
                    Tell us how your
                    <br />
                    company works.
                  </h1>
                  <p className="mt-5 max-w-lg text-[15px] leading-6 text-[#71716c]">
                    A little context helps Heighliner find useful routes instead
                    of generic automation ideas.
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
                    Explore with Amazonik <ArrowRight size={13} />
                  </button>
                </div>
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Company name"
                    value={company.name}
                    onChange={(v) => field("name", v)}
                    placeholder="Amazonik"
                  />
                  <TextField
                    label="Team size"
                    value={company.size}
                    onChange={(v) => field("size", v)}
                    select
                  />
                  <TextField
                    wide
                    label="What does the company do?"
                    value={company.description}
                    onChange={(v) => field("description", v)}
                    placeholder="We design and distribute premium gifts across Europe."
                  />
                  <TextField
                    label="Departments"
                    value={company.departments}
                    onChange={(v) => field("departments", v)}
                    placeholder="Sales, operations, support"
                  />
                  <TextField
                    label="Repetitive processes"
                    value={company.processes}
                    onChange={(v) => field("processes", v)}
                    placeholder="Order entry, weekly reporting"
                  />
                  <TextField
                    wide
                    label="Where does work get stuck?"
                    value={company.bottlenecks}
                    onChange={(v) => field("bottlenecks", v)}
                    placeholder="Manual product matching and repeated data entry"
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
                    Add company context
                  </div>
                  <h1 className="text-[46px] font-semibold leading-[1.04] tracking-[-.055em]">
                    Connect the places
                    <br />
                    where work happens.
                  </h1>
                  <p className="mt-5 text-[15px] leading-6 text-[#71716c]">
                    Upload knowledge and choose the systems Heighliner should
                    consider.
                  </p>
                </div>
                <div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
                  <div>
                    <h2 className="mb-3 text-[13px] font-semibold">
                      Company knowledge
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
                      <Upload size={19} />
                      <span className="mt-3 text-[12px] font-medium">
                        Choose files or drop them here
                      </span>
                      <span className="mt-1 text-[10px] text-[#92928d]">
                        PDF, Excel, CSV, Documents, Images
                      </span>
                    </button>
                    <div className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <div
                          key={f.name}
                          className="flex items-center gap-3 rounded-[14px] bg-white px-3 py-2.5"
                        >
                          <FileText size={14} className="text-[#777772]" />
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
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="mb-3 text-[13px] font-semibold">Systems</h2>
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
                              <CheckCircle2
                                className="ml-auto text-[#75cb8a]"
                                size={15}
                              />
                            ) : (
                              <Plus
                                className="ml-auto text-[#aaa9a4]"
                                size={14}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-[#92928d]">
                      Prototype connections are stored locally. Production OAuth
                      can be activated with Composio credentials.
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
            <ArrowLeft size={14} />
            Back
          </button>
          <Button
            disabled={!canContinue}
            onClick={() =>
              step === 0 ? setStep(1) : onComplete(company, files, connected)
            }
          >
            {step === 0 ? (
              <>
                Continue <ArrowRight size={14} />
              </>
            ) : (
              <>
                <Sparkles size={14} /> Find opportunities
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
  select?: boolean;
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
          <option>1–10</option>
          <option>11–50</option>
          <option>51–200</option>
          <option>201–500</option>
          <option>500+</option>
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
  reset,
}: {
  view: View;
  setView: (v: View) => void;
  routes: RouteData[];
  selected?: string;
  selectRoute: (id: string) => void;
  showRoutes: () => void;
  reset: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col bg-white/65 px-3 py-5 backdrop-blur-2xl">
      <div className="px-3">
        <Logo />
      </div>
      <nav className="mt-8 space-y-1">
        {(["Routes", "Opportunities", "Sources"] as View[]).map((name) => {
          const Icon =
            name === "Routes"
              ? RouteIcon
              : name === "Opportunities"
                ? Sparkles
                : Database;
          return (
            <button
              key={name}
              onClick={() => (name === "Routes" ? showRoutes() : setView(name))}
              className={`pressable flex h-10 w-full items-center gap-3 rounded-[11px] px-3 text-[13px] transition ${view === name ? "bg-black/[.065] font-medium" : "text-[#70706b] hover:bg-black/[.035]"}`}
            >
              <Icon size={16} strokeWidth={1.7} />
              {name}
              {name === "Opportunities" && (
                <span className="ml-auto text-[11px] text-[#999994]">6</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mx-3 my-5 h-px bg-black/[.055]" />
      <div className="px-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#aaa9a4]">
        Your routes
      </div>
      <div className="mt-2 space-y-1">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => selectRoute(route.id)}
            className={`pressable flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left ${selected === route.id && view === "Routes" ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#62a875]" />
            <span className="truncate text-[11px] font-medium">
              {route.title}
            </span>
          </button>
        ))}
        {routes.length === 0 && (
          <p className="px-3 py-2 text-[10px] leading-4 text-[#999994]">
            Create a route from an opportunity.
          </p>
        )}
      </div>
      <div className="mt-auto">
        <button
          onClick={reset}
          className="pressable flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-[11px] text-[#777772] hover:bg-black/[.04]"
        >
          <Settings2 size={14} />
          Company setup
        </button>
      </div>
    </aside>
  );
}

function ShellHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between bg-[#f7f7f5]/82 px-8 backdrop-blur-xl lg:px-10">
      <div>
        <h1 className="text-[19px] font-semibold tracking-[-.035em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[11px] text-[#898984]">{subtitle}</p>
        )}
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
  return (
    <div>
      <ShellHeader
        title="Opportunities"
        subtitle="Routes Heighliner found from your company context"
      />
      <div className="mx-auto max-w-[940px] px-8 py-10 lg:px-10">
        <div className="mb-10">
          <span className="text-[12px] font-medium text-[#e45e20]">
            Discovery complete
          </span>
          <h2 className="mt-3 text-[38px] font-semibold tracking-[-.05em]">
            {opportunities.length} valuable routes found.
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#777772]">
            Start with the highest-confidence route. You can inspect and change
            every step before running it.
          </p>
        </div>
        <div className="space-y-3">
          {opportunities.map((o, i) => (
            <motion.article
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.035 }}
              className="group rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.03),0_10px_30px_rgba(0,0,0,.025)]"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] ${i === 0 ? "bg-[#fff0e8] text-[#e45e20]" : "bg-black/[.045] text-[#666661]"}`}
                >
                  <RouteIcon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold tracking-[-.02em]">
                      {o.title}
                    </h3>
                    {i === 0 && (
                      <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[9px] font-semibold text-[#c84f1b]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#777772]">
                    {o.description}
                  </p>
                  <p className="mt-3 text-[10px] text-[#999994]">
                    <span className="font-medium text-[#686863]">
                      Evidence:
                    </span>{" "}
                    {o.evidence}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded-full bg-black/[.045] px-2.5 py-1">
                      {o.impact} impact
                    </span>
                    <span className="rounded-full bg-black/[.045] px-2.5 py-1">
                      {o.effort} effort
                    </span>
                    <span className="text-[#999994]">
                      {o.confidence}% confidence
                    </span>
                    <span className="text-[#999994]">
                      {o.systems.join(" · ")}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-[22px] font-semibold tracking-[-.045em]">
                    {o.hours}h
                  </div>
                  <div className="text-[9px] text-[#999994]">saved / week</div>
                  <Button
                    disabled={creating === o.id}
                    onClick={() => create(o)}
                    className="mt-5 h-9 px-3.5 text-[11px]"
                  >
                    {creating === o.id ? (
                      <Loader2 className="animate-spin" size={13} />
                    ) : (
                      <Plus size={13} />
                    )}{" "}
                    Create route
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowNode({ data, selected }: NodeProps<Node<FlowData>>) {
  const Icon = {
    system: Boxes,
    ai: Bot,
    knowledge: Database,
    logic: GitBranch,
    human: UserCheck,
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
          <Icon size={14} />
        </span>
        <span>
          <span className="block text-[11px] font-semibold">{data.label}</span>
          <span className="mt-0.5 block text-[9px] text-[#92928d]">
            {data.detail}
          </span>
        </span>
        {data.status === "done" && (
          <CheckCircle2 size={15} className="ml-auto text-[#57a26b]" />
        )}
        {data.status === "running" && (
          <Loader2 size={14} className="ml-auto animate-spin text-[#e45e20]" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function makeFlow(route: RouteData): {
  nodes: Node<FlowData>[];
  edges: Edge[];
} {
  const system = route.systems[0] || "Gmail";
  const destination = route.systems.at(-1) || "Business system";
  const labels = [
    [system, "New item received", "system"],
    ["Collect context", "Read source data", "knowledge"],
    [
      route.title.replace(
        /^(Automate|Qualify|Resolve|Reconcile|Draft|Enrich)\s/i,
        "",
      ),
      "AI transformation",
      "ai",
    ],
    ["Confidence check", "Result above 90%?", "logic"],
    ["Human review", "Resolve uncertainty", "human"],
    [`Update ${destination}`, "Complete the action", "system"],
    ["Route complete", "Destination reached", "system"],
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
      mk("d", "4", "5", "Review"),
      mk("e", "4", "6", ">90%"),
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
  setSelected: (id: string) => void;
}) {
  const selected = routes.find((r) => r.id === selectedId);
  const [step, setStep] = useState(0);
  const [inspected, setInspected] = useState<Node<FlowData> | null>(null);
  const [review, setReview] = useState(false);
  const flow = useMemo(
    () => (selected ? makeFlow(selected) : null),
    [selected],
  );
  useEffect(() => {
    setStep(0);
    setReview(false);
    setInspected(null);
  }, [selected?.id]);
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
          title="Routes"
          subtitle={`${routes.length} active ${routes.length === 1 ? "route" : "routes"}`}
        />
        <div className="mx-auto max-w-[1040px] px-8 py-10 lg:px-10">
          <div className="mb-8">
            <h2 className="text-[34px] font-semibold tracking-[-.05em]">
              Your routes
            </h2>
            <p className="mt-2 text-[13px] text-[#81817c]">
              AI-powered processes running across Amazonik.
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
                    <RouteIcon size={18} />
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#edf6ef] px-2.5 py-1 text-[9px] font-semibold text-[#3f7b50]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#59a76d]" />
                    Active
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
                        <Mail />
                      ) : system === "Salesforce" ? (
                        <Database />
                      ) : (
                        <Boxes />
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
                      runs this week
                    </span>
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold">
                      {96 - index}%
                    </span>
                    <span className="text-[9px] text-[#92928d]">success</span>
                  </div>
                  <div>
                    <span className="block text-[15px] font-semibold">
                      {route.hours}h
                    </span>
                    <span className="text-[9px] text-[#92928d]">
                      saved / week
                    </span>
                  </div>
                </div>
                <span className="mt-5 flex items-center justify-end gap-1 text-[10px] font-semibold text-[#686863] opacity-0 transition group-hover:opacity-100">
                  Open route <ChevronRight size={12} />
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
        <ShellHeader title="Routes" />
        <div className="grid h-[calc(100vh-82px)] place-items-center">
          <div className="max-w-md text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-white shadow-sm">
              <RouteIcon size={22} />
            </span>
            <h2 className="mt-6 text-[25px] font-semibold tracking-[-.04em]">
              Create your first route
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-[#81817c]">
              Choose an opportunity and Heighliner will build the route from
              your connected systems.
            </p>
          </div>
        </div>
      </div>
    );
  return (
    <div className="h-screen overflow-hidden">
      <ShellHeader
        title={selected.title}
        subtitle={`${selected.systems.join(" → ")} · ${selected.hours} hours saved each week`}
        action={
          <Button
            onClick={() => {
              setInspected(null);
              setStep(1);
            }}
            disabled={step > 0 && step < 8}
          >
            {step > 0 && step < 8 ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Running
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Run route
              </>
            )}
          </Button>
        }
      />
      <div className="relative h-[calc(100vh-82px)]">
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
                <X size={15} />
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#999994]">
                {inspected.data.kind}
              </span>
              <h3 className="mt-3 text-[20px] font-semibold tracking-[-.035em]">
                {inspected.data.label}
              </h3>
              <p className="mt-2 text-[12px] text-[#858580]">
                {inspected.data.detail}
              </p>
              <div className="mt-8 rounded-[16px] bg-black/[.04] p-4">
                <div className="text-[10px] font-medium">Configuration</div>
                <p className="mt-2 text-[10px] leading-5 text-[#777772]">
                  Uses the connected {selected.systems[0]} account and company
                  knowledge available to this route.
                </p>
              </div>
              {Number(inspected.id) < step && (
                <div className="mt-3 rounded-[16px] bg-[#edf6ef] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#347248]">
                    <Check size={13} /> Completed
                  </div>
                  <p className="mt-2 text-[10px] leading-5 text-[#55725e]">
                    Output is available and was passed to the next step.
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
              ? "Route complete"
              : review
                ? "Waiting for review"
                : `Running step ${step} of 7`}
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
  );
}

function ReviewSheet({ continueRoute }: { continueRoute: () => void }) {
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
          Human checkpoint
        </span>
        <h3 className="mt-2 text-[23px] font-semibold tracking-[-.04em]">
          Confirm the best match
        </h3>
        <p className="mt-2 text-[12px] leading-5 text-[#777772]">
          Heighliner found two possible results. Choose one to continue.
        </p>
        <div className="mt-5 space-y-2">
          {[
            ["BCN-GAUDI-03", "72%"],
            ["BCN-GAUDI-07", "68%"],
          ].map((item, i) => (
            <button
              key={item[0]}
              onClick={() => setChoice(i)}
              className={`pressable flex w-full items-center rounded-[16px] p-4 text-left ${choice === i ? "bg-[#fff1e9]" : "bg-black/[.035]"}`}
            >
              <span
                className={`mr-3 grid h-4 w-4 place-items-center rounded-full ${choice === i ? "bg-[#ff7a35]" : "bg-black/10"}`}
              >
                {choice === i && (
                  <Circle size={6} fill="white" className="text-white" />
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
          Continue route <ArrowRight size={13} />
        </Button>
      </motion.div>
    </div>
  );
}

function Sources({
  company,
  files,
  integrations,
  edit,
}: {
  company: Company;
  files: SourceFile[];
  integrations: string[];
  edit: () => void;
}) {
  return (
    <div>
      <ShellHeader
        title="Sources"
        subtitle="The context Heighliner uses to discover routes"
        action={
          <Button secondary onClick={edit}>
            Edit setup
          </Button>
        }
      />
      <div className="mx-auto max-w-[920px] p-10">
        <section>
          <h2 className="text-[13px] font-semibold">Connected systems</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {integrations.map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-[18px] bg-white p-4"
              >
                <SystemMark name={name} />
                <div>
                  <div className="text-[12px] font-medium">{name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] text-[#6f8e77]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#62a875]" />
                    Connected
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-[13px] font-semibold">Company knowledge</h2>
          <div className="mt-4 space-y-2">
            {files.length ? (
              files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-3"
                >
                  <FileText size={15} />
                  <span className="text-[11px] font-medium">{f.name}</span>
                  <span className="ml-auto text-[9px] text-[#999994]">
                    {Math.max(1, Math.round(f.size / 1024))} KB · Ready
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] bg-white p-6 text-[11px] text-[#888883]">
                No documents uploaded. Heighliner is using your company
                description.
              </div>
            )}
          </div>
        </section>
        <section className="mt-10 rounded-[22px] bg-white p-6">
          <h2 className="text-[13px] font-semibold">{company.name}</h2>
          <p className="mt-2 text-[12px] leading-5 text-[#777772]">
            {company.description}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-5 text-[10px]">
            <div>
              <span className="block text-[#999994]">Departments</span>
              <span className="mt-1 block font-medium">
                {company.departments || "Not provided"}
              </span>
            </div>
            <div>
              <span className="block text-[#999994]">Bottlenecks</span>
              <span className="mt-1 block font-medium">
                {company.bottlenecks || "Not provided"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [view, setView] = useState<View>("Routes");
  const [company, setCompany] = useState<Company>(defaults);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selected, setSelected] = useState<string>();
  const [creating, setCreating] = useState<string | null>(null);
  useEffect(() => {
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
  const persist = (data: object) =>
    localStorage.setItem("heighliner-workspace", JSON.stringify(data));
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
                edit={reset}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
