"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["auth"]["getSession"]>>["data"]["session"]
>;

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

function isWeakPassword(value: string) {
  return value.length > 0 && value.length < 8;
}

function isNetworkError(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("failed to fetch") || text.includes("network") || text.includes("timeout");
}

function isRateLimited(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("rate limit") || text.includes("too many") || text.includes("429");
}

export default function ChangePasswordPage() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success">("info");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [postUpdateHref, setPostUpdateHref] = useState("/account");

  const user = session?.user || null;
  const signedIn = !!(session?.access_token && user?.id);

  const authProvider = useMemo(() => {
    const appMeta = user?.app_metadata || {};
    const provider = typeof appMeta.provider === "string" ? appMeta.provider : "";
    if (provider) return provider;
    const providers = Array.isArray(appMeta.providers) ? appMeta.providers : [];
    const first = typeof providers[0] === "string" ? providers[0] : "";
    if (first) return first;
    return "email";
  }, [user]);

  const providerLabel = useMemo(() => {
    if (!authProvider) return "Email";
    if (authProvider === "email") return "Email";
    return authProvider.charAt(0).toUpperCase() + authProvider.slice(1);
  }, [authProvider]);

  const canManagePassword = authProvider === "email";

  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setSessionLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!signedIn) {
      router.replace("/login");
    }
  }, [sessionLoading, signedIn, router]);

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!signedIn || !session?.access_token) return;
    if (authProvider !== "email") {
      setError(`Password changes are managed by your ${providerLabel} sign-in.`);
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (isWeakPassword(newPassword)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!user?.email) {
      setError("Missing account email. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const verifiedSession = (await supabaseRequest("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email: user.email, password: currentPassword }),
      })) as AuthSession;
      const updateToken = verifiedSession?.access_token || session.access_token;

      await supabaseRequest(
        "/auth/v1/user",
        {
          method: "PUT",
          body: JSON.stringify({ password: newPassword }),
        },
        updateToken
      );
      // Attempt to re-authenticate so /account works without redirecting to /login
      const { error: reauthError } = await supabaseRef.current.auth.signInWithPassword({
        email: user.email,
        password: newPassword,
      });
      if (reauthError) {
        setPostUpdateHref("/login");
        setStatus("Password updated. Please sign in again.");
        setStatusType("info");
      } else {
        setPostUpdateHref("/account");
        setStatus("Password updated.");
        setStatusType("success");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password update failed.";
      if (isRateLimited(message)) return setError("Too many attempts. Please wait and try again.");
      if (isNetworkError(message)) return setError("Network error. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Change password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update your account password. If you signed in with a social provider, manage it there.
        </p>

        {sessionLoading ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Checking session...
          </p>
        ) : null}

        {!sessionLoading && !canManagePassword ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Password changes are managed by your {providerLabel} sign-in.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {status ? (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              statusType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-sky-200 bg-sky-50 text-sky-800"
            }`}
          >
            {status}
          </p>
        ) : null}
        {status ? (
          <div className="mt-3">
            <a
              href={postUpdateHref}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              {postUpdateHref === "/account" ? "Back to account" : "Back to sign in"}
            </a>
          </div>
        ) : null}

        {canManagePassword ? (
          <>
            <form className="mt-6 space-y-4" onSubmit={onChangePassword}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                  disabled={loading}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <div className="mt-5 text-sm text-slate-600">
              <a href="/forgot-password" className="font-semibold text-emerald-600 hover:underline">
                Forgot password?
              </a>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <a
              href="/account"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Back to account
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
