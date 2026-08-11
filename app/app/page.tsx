"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WorkspaceData = { user: { email: string }; workspace: { name: string; description: string } | null; sources: { id: number; name: string; kind: string; parsedText: string | null }[]; opportunities: { id: number; title: string; description: string; status: string }[]; routes: { id: number; title: string; description: string }[] };
const empty: WorkspaceData = { user: { email: "" }, workspace: null, sources: [], opportunities: [], routes: [] };

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="panel"><h2>{title}</h2>{children}</section>; }

export default function WorkspacePage() {
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/workspace"); if (response.status === 401) return router.replace("/signin"); setData(response.ok ? await response.json() : empty); }
  useEffect(() => { void load(); }, []);
  async function json(path: string, payload: unknown) { const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error((await response.json()).error || "Request failed"); await load(); }
  async function profile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await json("/api/workspace", { name: form.get("name"), description: form.get("description") }); setMessage("Workspace saved"); }
  async function opportunity(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await json("/api/opportunities", { title: form.get("title"), description: form.get("description") }); event.currentTarget.reset(); }
  async function source(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch("/api/sources", { method: "POST", body: form }); if (!response.ok) setMessage((await response.json()).error || "Unable to add source"); else { event.currentTarget.reset(); setMessage("Source added and parsed"); await load(); } }
  if (!data) return <main className="loading">Loading your workspace...</main>;
  return <main className="workspace"><header><div><p className="eyebrow">Heighliner</p><h1>Automation workspace</h1><span>{data.user.email}</span></div><button className="secondary" onClick={async () => { await fetch("/api/auth/signout", { method: "POST" }); router.replace("/signin"); }}>Sign out</button></header><div className="grid">
    <Panel title="Workspace profile"><form onSubmit={profile}><input name="name" defaultValue={data.workspace?.name || ""} placeholder="Company name" required /><textarea name="description" defaultValue={data.workspace?.description || ""} placeholder="What are you trying to improve?" /><button>Save profile</button>{message && <small>{message}</small>}</form></Panel>
    <Panel title="Sources"><form onSubmit={source}><input name="file" type="file" required accept=".pdf,.txt,.md,.csv,image/*" /><button>Upload and parse</button></form><ul>{data.sources.map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.kind}</span>{item.parsedText && <small>{item.parsedText.slice(0, 140)}{item.parsedText.length > 140 ? "..." : ""}</small>}</li>)}{!data.sources.length && <li className="muted">Upload a PDF, image, text file, or CSV.</li>}</ul></Panel>
    <Panel title="Opportunities"><form onSubmit={opportunity}><input name="title" required placeholder="Opportunity title" /><textarea name="description" required placeholder="What could change?" /><button>Add opportunity</button></form><button className="secondary generate" onClick={() => void json("/api/opportunities/generate", {}).catch((error: Error) => setMessage(error.message))}>Generate from sources</button><ul>{data.opportunities.map((item) => <li key={item.id}><strong>{item.title}</strong><small>{item.description}</small>{item.status === "open" && <button className="secondary" onClick={() => void json(`/api/opportunities/${item.id}/route`, {})}>Create route</button>}</li>)}{!data.opportunities.length && <li className="muted">Capture opportunities as you find them.</li>}</ul></Panel>
    <Panel title="Routes"><ul>{data.routes.map((item) => <li key={item.id}><strong>{item.title}</strong><small>{item.description}</small></li>)}{!data.routes.length && <li className="muted">Create a route from an opportunity.</li>}</ul></Panel>
  </div></main>;
}
