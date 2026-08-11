"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setPending(false);
    if (!response.ok) return setError((await response.json()).error || "Unable to continue.");
    router.replace("/app");
    router.refresh();
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
    <p className="eyebrow">Heighliner</p>
    <h1>{mode === "signin" ? "Welcome back" : "Create your workspace"}</h1>
    <p>Use an email and password. Your account and data stay in your local SQLite database.</p>
    <label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@company.com" /></label>
    <label>Password<input name="password" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 8 characters" /></label>
    {error && <p className="error">{error}</p>}
    <button disabled={pending}>{pending ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}</button>
    <button className="text-button" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
  </form></main>;
}
