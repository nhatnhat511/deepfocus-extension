"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import PaddleCheckoutCard from "@/components/PaddleCheckoutCard";

type AuthSession = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

type ProfileRow = {
  id: string;
  email: string | null;
  plan: "free" | "trial" | "premium";
  premium_until: string | null;
  trial_used: boolean;
  trial_started_at: string | null;
  is_premium_active: boolean;
  is_trial_active: boolean;
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

function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function isExpiredTokenError(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("token is expired") || text.includes("jwt expired");
}

export default function AccountPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("Not signed in.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  const user = session?.user || null;
  const signedIn = !!(session?.access_token && user?.id);

  const avatarUrl = useMemo(() => {
    const meta = user?.user_metadata || {};
    return typeof meta.avatar_url === "string" ? meta.avatar_url : "";
  }, [user]);

  const accountSummary = useMemo(() => {
    if (!profile) return { label: "Free", detail: "No active premium access." };
    const now = Date.now();
    const untilTs = profile.premium_until ? Date.parse(profile.premium_until) : 0;
    const activePremium = !!(untilTs && Number.isFinite(untilTs) && untilTs > now);

    if (profile.plan === "trial" && activePremium) {
      const msLeft = untilTs - now;
      const mins = Math.max(1, Math.ceil(msLeft / 60000));
      const days = Math.floor(mins / (60 * 24));
      const hours = Math.floor((mins % (60 * 24)) / 60);
      const detail = days > 0 ? `${days}d ${hours}h remaining` : `${mins}m remaining`;
      return { label: "Trial", detail: `Trial Time Remaining: ${detail}` };
    }

    if (profile.plan === "premium" && activePremium) {
      return {
        label: "Premium",
        detail: `Premium Until: ${new Date(untilTs).toLocaleString()}`,
      };
    }

    if (profile.trial_used) {
      return { label: "Free", detail: "Trial already used. Upgrade to unlock premium again." };
    }

    return { label: "Free", detail: "No active premium access. You can start a 7-day free trial." };
  }, [profile]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || !hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token") || "";
    if (!accessToken) return;

    const oauthSession: AuthSession = {
      access_token: accessToken,
      refresh_token: params.get("refresh_token") || "",
      token_type: params.get("token_type") || "bearer",
      expires_in: Number(params.get("expires_in") || 0),
    };

    setSession(oauthSession);
    saveSession(oauthSession);
    setStatus("Signed in successfully.");
    setError("");
    void refreshCurrentUser(oauthSession);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, "/account");
    }
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    setStatus("Session restored.");
    void refreshCurrentUser(s);
  }, []);

  async function fetchEntitlement(activeSession: AuthSession) {
    const payload = await supabaseRequest(
      "/rest/v1/rpc/get_account_entitlement",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      activeSession.access_token
    );
    const row = Array.isArray(payload) ? payload[0] : payload;
    if (!row || typeof row !== "object") {
      setProfile(null);
      return;
    }
    setProfile(row as ProfileRow);
  }

  async function refreshAccessToken(activeSession: AuthSession) {
    const refreshToken = String(activeSession.refresh_token || "");
    if (!refreshToken) return null;
    const payload = (await supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    })) as AuthSession;
    if (!payload?.access_token) return null;
    const nextSession: AuthSession = {
      ...activeSession,
      ...payload,
      refresh_token: payload.refresh_token || refreshToken,
    };
    setSession(nextSession);
    saveSession(nextSession);
    return nextSession;
  }

  async function startTrial() {
    if (!session?.access_token || !signedIn) return;
    setError("");
    setLoading(true);
    try {
      await supabaseRequest(
        "/rest/v1/rpc/start_free_trial",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        session.access_token
      );
      await fetchEntitlement(session);
      setStatus("Free trial activated. Premium unlocked for 7 days.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to activate trial.";
      if (msg.includes("TRIAL_ALREADY_USED")) {
        setError("This account already used the 7-day free trial.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshCurrentUser(activeSession: AuthSession | null = session, allowRetry = true) {
    if (!activeSession?.access_token) return;
    try {
      const profile = (await supabaseRequest("/auth/v1/user", { method: "GET" }, activeSession.access_token)) as Record<
        string,
        unknown
      >;
      const updated: AuthSession = {
        ...activeSession,
        user: {
          id: String(profile.id || ""),
          email: String(profile.email || ""),
          user_metadata: (profile.user_metadata as Record<string, unknown>) || {},
        },
      };
      setSession(updated);
      saveSession(updated);
      await fetchEntitlement(updated);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Session refresh failed.";
      if (allowRetry && isExpiredTokenError(message)) {
        try {
          const refreshed = await refreshAccessToken(activeSession);
          if (refreshed?.access_token) {
            await refreshCurrentUser(refreshed, false);
            setError("");
            return;
          }
        } catch {
          // continue to session cleanup below
        }
        setSession(null);
        setProfile(null);
        saveSession(null);
        setStatus("Session expired. Please sign in again.");
        setError("");
        return;
      }
      setError(message);
    }
  }

  async function onSignIn() {
    setError("");
    setLoading(true);
    try {
      const payload = (await supabaseRequest("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      })) as AuthSession;
      setSession(payload);
      saveSession(payload);
      await refreshCurrentUser(payload);
      setStatus("Signed in successfully.");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onSignUp() {
    setError("");
    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/confirm?next=/account` : undefined;
      const payload = (await supabaseRequest("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(redirectTo ? { email_redirect_to: redirectTo } : {}),
        }),
      })) as AuthSession;
      if (payload?.access_token) {
        setSession(payload);
        saveSession(payload);
        await refreshCurrentUser(payload);
        setStatus("Account created and signed in.");
      } else {
        setStatus("Account created. Check your email to confirm if required.");
      }
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onAuthSubmit(e: FormEvent) {
    e.preventDefault();
    if (authMode === "signup") {
      await onSignUp();
      return;
    }
    await onSignIn();
  }

  async function onSignOut() {
    setError("");
    setLoading(true);
    try {
      if (session?.access_token) {
        await supabaseRequest("/auth/v1/logout", { method: "POST" }, session.access_token);
      }
    } catch {
      // ignore network/logout errors and continue cleanup
    } finally {
      setSession(null);
      setProfile(null);
      saveSession(null);
      setAvatarPreview("");
      setStatus("Signed out.");
      setLoading(false);
    }
  }

  async function onAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file || !session?.access_token) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl.startsWith("data:image/")) {
        setError("Please select an image file.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        await supabaseRequest(
          "/auth/v1/user",
          {
            method: "PUT",
            body: JSON.stringify({
              data: {
                avatar_url: dataUrl,
              },
            }),
          },
          session.access_token
        );
        setAvatarPreview(dataUrl);
        await refreshCurrentUser(session);
        setStatus("Avatar updated.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Avatar update failed.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onUpdatePassword(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setError("");
    setLoading(true);
    try {
      await supabaseRequest(
        "/auth/v1/user",
        {
          method: "PUT",
          body: JSON.stringify({ password: newPassword }),
        },
        session.access_token
      );
      setNewPassword("");
      setStatus("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setLoading(false);
    }
  }

  function startOAuth(provider: "google" | "github") {
    if (typeof window === "undefined") return;
    setError("");
    const redirectTo = `${window.location.origin}/account`;
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectTo)}`;
    window.location.href = authUrl;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your DeepFocus account, login, and profile settings.</p>
      </section>

      {!signedIn ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Welcome back!</h2>
              <p className="mt-2 text-sm text-slate-600">
                {authMode === "signin" ? "New to DeepFocus?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="text-emerald-600 underline-offset-2 hover:underline"
                >
                  {authMode === "signin" ? "Create account" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onAuthSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                required
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{authMode === "signup" ? "Minimum 8 characters recommended." : " "}</span>
                <a
                  href="/support"
                  className="text-emerald-600 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Working..." : authMode === "signup" ? "Create account" : "Login"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px w-full bg-slate-200" />
            <span>or</span>
            <span className="h-px w-full bg-slate-200" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => startOAuth("google")}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6-.1-1.2-.2-1.8H12z"/>
                <path fill="#34A853" d="M6.5 14.3l-.7.5-2.5 2c1.6 3.1 4.8 5.2 8.7 5.2 2.5 0 4.6-.8 6.1-2.3l-3-2.3c-.8.5-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8z"/>
                <path fill="#4A90E2" d="M3.3 7.2C2.8 8.2 2.5 9.4 2.5 10.7c0 1.3.3 2.5.8 3.5 0 0 3.2-2.5 3.2-2.5-.2-.4-.3-.9-.3-1.4s.1-.9.3-1.4z"/>
                <path fill="#FBBC05" d="M12 5.1c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.6 2.2 14.5 1.3 12 1.3 8.1 1.3 4.9 3.4 3.3 6.5l3.2 2.5c.7-2.2 2.7-3.9 5.5-3.9z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => startOAuth("github")}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path fill="currentColor" d="M12 .5C5.65.5.5 5.74.5 12.2c0 5.17 3.3 9.55 7.87 11.1.58.11.79-.26.79-.57 0-.28-.01-1.2-.02-2.18-3.2.71-3.88-1.39-3.88-1.39-.52-1.35-1.28-1.71-1.28-1.71-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.22 1.77 1.22 1.03 1.81 2.71 1.29 3.37.99.1-.76.4-1.29.73-1.59-2.55-.3-5.23-1.31-5.23-5.83 0-1.29.45-2.35 1.19-3.18-.12-.3-.52-1.51.11-3.15 0 0 .97-.32 3.19 1.21a10.8 10.8 0 0 1 5.8 0c2.22-1.53 3.19-1.21 3.19-1.21.63 1.64.23 2.85.11 3.15.74.83 1.19 1.89 1.19 3.18 0 4.53-2.68 5.52-5.24 5.82.41.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.22 0 .31.21.69.8.57 4.57-1.55 7.86-5.93 7.86-11.1C23.5 5.74 18.35.5 12 .5z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            By signing in you confirm that you have read our{" "}
            <a className="text-emerald-600 hover:underline" href="/privacy">Privacy Policy</a>{" "}
            and that you accept our{" "}
            <a className="text-emerald-600 hover:underline" href="/terms">Terms of Service</a>.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="mt-1 text-sm text-slate-600">Keep your profile details and security settings up to date.</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[auto,1fr]">
            <div className="flex flex-col items-start gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {(avatarPreview || avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview || avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Upload Avatar
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
              </label>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{user?.email || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{accountSummary.label}</p>
                <p className="mt-1 text-xs text-slate-600">{accountSummary.detail}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {!profile?.is_premium_active && !profile?.trial_used ? (
              <button
                type="button"
                onClick={startTrial}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Start 7-day Free Trial (No Card)
              </button>
            ) : null}
            {profile?.plan !== "premium" ? <PaddleCheckoutCard /> : null}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <form className="space-y-3" onSubmit={onUpdatePassword}>
              <label className="block text-sm font-semibold text-slate-800">Change password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
              >
                Update Password
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            disabled={loading}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Sign Out
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <p className="text-slate-700">{status}</p>
        {error ? <p className="mt-2 text-rose-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Get the Chrome Extension</h2>
        <p className="mt-2 text-sm text-slate-600">
          Install DeepFocus Time on Chrome to start focused sessions right from your browser.
        </p>
        <a
          href="https://chromewebstore.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Open Chrome Web Store
        </a>
      </section>
    </div>
  );
}
