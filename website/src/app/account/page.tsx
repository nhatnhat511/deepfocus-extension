"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

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

export default function AccountPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
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

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    setStatus("Session restored.");
    void refreshCurrentUser(s);
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    if (user?.email) setNewEmail(user.email);
  }, [signedIn, user?.email]);

  async function refreshCurrentUser(activeSession: AuthSession | null = session) {
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
    } catch (e) {
      const message = e instanceof Error ? e.message : "Session refresh failed.";
      setError(message);
    }
  }

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
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

  async function onSignUp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = (await supabaseRequest("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
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
        await refreshCurrentUser();
        setStatus("Avatar updated.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Avatar update failed.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onUpdateEmail(e: FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setError("");
    setLoading(true);
    try {
      await supabaseRequest(
        "/auth/v1/user",
        {
          method: "PUT",
          body: JSON.stringify({ email: newEmail.trim() }),
        },
        session.access_token
      );
      await refreshCurrentUser();
      setStatus("Email update requested. Check inbox for confirmation.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email update failed.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your DeepFocus account, login, and profile settings.</p>
      </section>

      {!signedIn ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Sign in or register</h2>
          <form className="mt-4 space-y-3" onSubmit={onSignIn}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onSignUp}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
              >
                Register
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <p className="mt-1 text-sm text-slate-600">{user?.email || "-"}</p>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {(avatarPreview || avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview || avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
              Upload Avatar
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            </label>
          </div>

          <form className="mt-5 space-y-3" onSubmit={onUpdateEmail}>
            <label className="block text-sm font-semibold text-slate-800">Change email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
            >
              Update Email
            </button>
          </form>

          <form className="mt-5 space-y-3" onSubmit={onUpdatePassword}>
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
    </div>
  );
}
