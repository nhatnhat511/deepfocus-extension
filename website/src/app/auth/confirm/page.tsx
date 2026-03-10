"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuthSession = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";
const SESSION_KEY = "deepfocusWebsiteSession";

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

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

export default function AuthConfirmPage() {
  const [message, setMessage] = useState("Confirming your email...");
  const [isError, setIsError] = useState(false);
  const [nextPath, setNextPath] = useState("/account");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const tokenHash = searchParams.get("token_hash") || "";
      const type = searchParams.get("type") || "signup";
      const next = searchParams.get("next") || "/account";

      setNextPath(next);

      try {
        if (hashParams.get("access_token")) {
          const session: AuthSession = {
            access_token: String(hashParams.get("access_token") || ""),
            refresh_token: String(hashParams.get("refresh_token") || ""),
            token_type: String(hashParams.get("token_type") || "bearer"),
            expires_in: Number(hashParams.get("expires_in") || 0),
          };
          saveSession(session);
          setMessage("Email verified. Redirecting you to your account...");
        } else if (tokenHash) {
          const payload = (await supabaseRequest("/auth/v1/verify", {
            method: "POST",
            body: JSON.stringify({ token_hash: tokenHash, type }),
          })) as AuthSession | { session?: AuthSession };

          const session =
            (payload as AuthSession)?.access_token
              ? (payload as AuthSession)
              : ((payload as { session?: AuthSession }).session || null);

          if (session?.access_token) {
            saveSession(session);
            setMessage("Email verified. Redirecting you to your account...");
          } else {
            setMessage("Email verified. Please continue to your account.");
          }
        } else {
          throw new Error("Missing verification token. Please open the latest confirmation email.");
        }

        window.history.replaceState({}, document.title, url.pathname);
        window.setTimeout(() => {
          window.location.replace(next);
        }, 1200);

        window.setTimeout(() => {
          window.close();
        }, 1800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Email confirmation failed.";
        setIsError(true);
        setMessage(msg);
      }
    };

    void run();
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Email Confirmation</h1>
      <p className={`mt-2 text-sm ${isError ? "text-rose-600" : "text-slate-600"}`}>{message}</p>
      <Link
        href={nextPath}
        className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
      >
        Continue to account
      </Link>
    </div>
  );
}
