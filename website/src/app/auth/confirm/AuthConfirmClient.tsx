"use client";

import { useEffect, useState } from "react";

type AuthSession = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
  };
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";
const SESSION_KEY = "deepfocusWebsiteSession";

async function supabaseRequest(path: string, options: RequestInit = {}, accessToken = "") {
  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const p = payload as Record<string, unknown> | null;
    const msg =
      (p && (String(p.msg || p.message || p.error_description || p.error || ""))) || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return payload;
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export default function AuthConfirmClient() {
  const [status, setStatus] = useState("Confirming your email...");
  const [detail, setDetail] = useState("Please keep this tab open while we complete verification.");
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("/account");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      try {
        const current = new URL(window.location.href);
        const hashParams = new URLSearchParams(current.hash.replace(/^#/, ""));
        const next = current.searchParams.get("next") || "/account";
        setNextPath(next);
        const accessToken = hashParams.get("access_token") || "";

        if (accessToken) {
          const session: AuthSession = {
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
            token_type: hashParams.get("token_type") || "bearer",
            expires_in: Number(hashParams.get("expires_in") || 0),
          };
          saveSession(session);
          await supabaseRequest("/auth/v1/user", { method: "GET" }, session.access_token);
          setStatus("Email verified");
          setDetail("Your account is now confirmed. Redirecting you now.");
          setTimeout(() => window.location.replace(next), 1200);
          setTimeout(() => window.close(), 1800);
          return;
        }

        const tokenHash = current.searchParams.get("token_hash") || "";
        const token = current.searchParams.get("token") || "";
        const type = current.searchParams.get("type") || "";
        if (tokenHash && type) {
          const payload = (await supabaseRequest("/auth/v1/verify", {
            method: "POST",
            body: JSON.stringify({ token_hash: tokenHash, type }),
          })) as AuthSession;
          if (!payload?.access_token) {
            throw new Error("Verification completed, but no session was returned.");
          }
          saveSession(payload);
          await supabaseRequest("/auth/v1/user", { method: "GET" }, payload.access_token);
          setStatus("Email verified");
          setDetail("Your account is now confirmed. Redirecting you now.");
          setTimeout(() => window.location.replace(next), 1200);
          setTimeout(() => window.close(), 1800);
          return;
        }

        if (token && type) {
          const payload = (await supabaseRequest("/auth/v1/verify", {
            method: "POST",
            body: JSON.stringify({ token, type }),
          })) as AuthSession;
          if (!payload?.access_token) {
            throw new Error("Verification completed, but no session was returned.");
          }
          saveSession(payload);
          await supabaseRequest("/auth/v1/user", { method: "GET" }, payload.access_token);
          setStatus("Email verified");
          setDetail("Your account is now confirmed. Redirecting you now.");
          setTimeout(() => window.location.replace(next), 1200);
          setTimeout(() => window.close(), 1800);
          return;
        }

        setStatus("Verification link incomplete");
        setDetail("Please reopen the verification link from your email.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verification failed.";
        const lowered = message.toLowerCase();
        if (lowered.includes("expired") || lowered.includes("invalid") || lowered.includes("token")) {
          setStatus("Verification link expired");
          setDetail("Your confirmation link has expired. Please request a new confirmation email.");
        } else {
          setStatus("Verification failed");
          setDetail("Please try again or contact support.");
        }
        setError(message);
      } finally {
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, "/auth/confirm");
        }
      }
    };

    void run();
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">{status}</h1>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      <a
        href={nextPath}
        className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
      >
        Continue
      </a>
    </div>
  );
}
