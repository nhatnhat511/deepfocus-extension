"use client";

import { useEffect } from "react";

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

function saveSession(session: { access_token: string; refresh_token?: string } | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getProjectRef() {
  try {
    const url = new URL(SUPABASE_URL);
    return url.hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

export default function AuthCallbackPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const run = async () => {
      const { hash, search } = window.location;
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const flowType = params.get("type");
        if (accessToken && flowType === "recovery") {
          window.location.replace(`/update-password${hash}`);
          return;
        }
        window.location.replace(`/account${hash}`);
        return;
      }

      const query = new URLSearchParams(search);
      const code = query.get("code");
      const flowType = query.get("type") || "";
      if (!code) {
        window.location.replace("/login");
        return;
      }

      const projectRef = getProjectRef();
      const codeVerifier =
        window.localStorage.getItem(`sb-${projectRef}-auth-token-code-verifier`) ||
        window.localStorage.getItem("supabase.auth.code_verifier");

      if (!codeVerifier) {
        window.location.replace("/login");
        return;
      }

      const payload = (await supabaseRequest("/auth/v1/token?grant_type=pkce", {
        method: "POST",
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
      })) as { access_token?: string; refresh_token?: string };

      if (payload?.access_token) {
        saveSession({ access_token: payload.access_token, refresh_token: payload.refresh_token });
        if (flowType === "recovery") {
          window.location.replace("/update-password");
          return;
        }
        window.location.replace("/account");
        return;
      }

      window.location.replace("/login");
    };

    void run();
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Completing sign-in...</h1>
      <p className="mt-2 text-sm text-slate-600">Please keep this tab open while we finish.</p>
    </div>
  );
}
