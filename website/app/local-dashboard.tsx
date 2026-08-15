"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  CheckIcon,
  CheckmarkCircle02Icon,
  SparklesIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { LoadingOrb } from "../components/loading-orb";
import {
  Button,
  companyDefaults,
  connectedSystems,
  LocaleContext,
  Logo,
  normalizeRouteSystems,
  OpportunityList,
  Routes,
  Sidebar,
  SidebarMobileProvider,
  Sources,
  spring,
  SystemMark,
  translations,
  type Company,
  type Opportunity,
  type RouteData,
  type RouteExecution,
  type RouteStep,
  type SourceFile,
  type View,
} from "./home";

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

export default function LocalDashboard() {
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
  const hasKnowledge = files.length > 0;
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
      systems: connectedSystems(integrations, hasKnowledge, profileType),
    }),
  );
  const routes: RouteData[] = (workspace?.routes || []).map((item) => ({
    id: String(item.id),
    opportunityId: item.opportunityId ? `opp_${item.opportunityId}` : undefined,
    title: item.title,
    description: item.description,
    hours: item.hours,
    systems: normalizeRouteSystems(
      item.systems,
      integrations,
      hasKnowledge,
      profileType,
    ),
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
        <SidebarMobileProvider>
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
          <main className="min-h-screen lg:ml-[250px]">
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
        </SidebarMobileProvider>
        {setupOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-5 backdrop-blur-[4px]">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Set up Heighliner"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={spring}
              className="w-full max-w-[720px] rounded-[28px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,.2)] sm:p-7"
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
