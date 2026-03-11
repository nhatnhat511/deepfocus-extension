"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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

function getSafeNextPath(rawNext: string | null) {
  if (!rawNext) return "/account";
  if (!rawNext.startsWith("/") || rawNext.startsWith("//")) return "/account";
  if (rawNext.startsWith("/auth/confirm")) return "/account";
  return rawNext;
}

export default function AuthConfirmClient() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [status, setStatus] = useState("Confirming your email...");
  const [detail, setDetail] = useState("Please keep this tab open while we complete verification.");
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("/account");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      try {
        const current = new URL(window.location.href);
        const hashParams = new URLSearchParams(current.hash.replace(/^#/, ""));
        const next = getSafeNextPath(current.searchParams.get("next"));
        setNextPath(next);
        const accessToken = hashParams.get("access_token") || "";
        const hashError = hashParams.get("error_description") || hashParams.get("error");
        if (hashError) {
          setStatus("Verification failed");
          setDetail(String(hashError));
          return;
        }

        if (accessToken) {
          const session: AuthSession = {
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
            token_type: hashParams.get("token_type") || "bearer",
            expires_in: Number(hashParams.get("expires_in") || 0),
          };
          await supabaseRef.current.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token || "",
          });
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
            setStatus("Email verified");
            setDetail("Your account is now confirmed. Please sign in.");
            setTimeout(() => window.location.replace(next), 1200);
            return;
          }
          await supabaseRef.current.auth.setSession({
            access_token: payload.access_token,
            refresh_token: payload.refresh_token || "",
          });
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
            setStatus("Email verified");
            setDetail("Your account is now confirmed. Please sign in.");
            setTimeout(() => window.location.replace(next), 1200);
            return;
          }
          await supabaseRef.current.auth.setSession({
            access_token: payload.access_token,
            refresh_token: payload.refresh_token || "",
          });
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
        if (lowered.includes("already") && lowered.includes("confirm")) {
          setStatus("Email already verified");
          setDetail("Your email is already confirmed. You can sign in now.");
        } else if (lowered.includes("expired") || lowered.includes("invalid") || lowered.includes("token")) {
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

  async function resendConfirmationEmail() {
    if (!resendEmail.trim()) {
      setResendError("Please enter your email.");
      return;
    }
    setResendError("");
    setResendStatus("");
    setResendLoading(true);
    try {
      await supabaseRequest("/auth/v1/resend", {
        method: "POST",
        body: JSON.stringify({
          type: "signup",
          email: resendEmail.trim(),
          email_redirect_to: typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined,
        }),
      });
      setResendStatus("Confirmation email sent. Please check your inbox.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to resend confirmation email.";
      setResendError(message);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">{status}</h1>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {status.toLowerCase().includes("expired") || status.toLowerCase().includes("incomplete") ? (
        <div className="mt-5 space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {resendError ? <p className="text-sm text-rose-600">{resendError}</p> : null}
          {resendStatus ? <p className="text-sm text-emerald-600">{resendStatus}</p> : null}
          <button
            type="button"
            onClick={resendConfirmationEmail}
            disabled={resendLoading}
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
          >
            {resendLoading ? "Sending..." : "Resend confirmation email"}
          </button>
        </div>
      ) : null}
      <a
        href={nextPath}
        className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
      >
        Continue
      </a>
    </div>
  );
}
