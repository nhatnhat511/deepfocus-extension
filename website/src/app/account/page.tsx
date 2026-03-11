"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import PaddleCheckoutCard from "@/components/PaddleCheckoutCard";

type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["auth"]["getSession"]>>["data"]["session"]
>;

type ProfileRow = {
  id: string;
  email: string | null;
  plan: "free" | "trial" | "premium" | "premium_monthly" | "premium_yearly";
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

function isNetworkError(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("failed to fetch") || text.includes("network") || text.includes("timeout");
}

function isRateLimited(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("rate limit") || text.includes("too many") || text.includes("429");
}

function isWeakPassword(value: string) {
  return value.length > 0 && value.length < 8;
}

export default function AccountPage() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState("Not signed in.");
  const [statusType, setStatusType] = useState<"info" | "success">("info");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [passwordStage, setPasswordStage] = useState<"idle" | "requested" | "ready">("idle");
  const [preferredPlan, setPreferredPlan] = useState<"monthly" | "yearly">("monthly");
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const user = session?.user || null;
  const signedIn = !!(session?.access_token && user?.id);

  const avatarUrl = useMemo(() => {
    const meta = user?.user_metadata || {};
    return typeof meta.avatar_url === "string" ? meta.avatar_url : "";
  }, [user]);

  const authProvider = useMemo(() => {
    const appMeta = user?.app_metadata || {};
    const provider = typeof appMeta.provider === "string" ? appMeta.provider : "";
    if (provider) return provider;
    const providers = Array.isArray(appMeta.providers) ? appMeta.providers : [];
    const first = typeof providers[0] === "string" ? providers[0] : "";
    if (first) return first;
    const identities = Array.isArray(user?.identities) ? user?.identities : [];
    const identityProvider =
      identities.length && typeof identities[0]?.provider === "string" ? String(identities[0].provider) : "";
    return identityProvider || "email";
  }, [user]);

  const isPasswordEligible = authProvider === "email";
  const providerLabel = useMemo(() => {
    if (!authProvider) return "Email";
    if (authProvider === "email") return "Email";
    return authProvider.charAt(0).toUpperCase() + authProvider.slice(1);
  }, [authProvider]);

  const accountSummary = useMemo(() => {
    if (!profile) return { label: "Free", detail: "No active premium access." };
    const now = Date.now();
    const untilTs = profile.premium_until ? Date.parse(profile.premium_until) : 0;
    const activePremium = !!(untilTs && Number.isFinite(untilTs) && untilTs > now);
    const isPremium =
      profile.plan === "premium" || profile.plan === "premium_monthly" || profile.plan === "premium_yearly";
    const premiumLabel =
      profile.plan === "premium_yearly" ? "Premium (Yearly)" : "Premium (Monthly)";

    if (profile.plan === "trial" && activePremium) {
      const msLeft = untilTs - now;
      const mins = Math.max(1, Math.ceil(msLeft / 60000));
      const days = Math.floor(mins / (60 * 24));
      const hours = Math.floor((mins % (60 * 24)) / 60);
      const detail = days > 0 ? `${days}d ${hours}h remaining` : `${mins}m remaining`;
      return { label: "Trial", detail: `Trial Time Remaining: ${detail}` };
    }

    if (isPremium && activePremium) {
      return {
        label: premiumLabel,
        detail: `Premium Until: ${new Date(untilTs).toLocaleString()}`,
      };
    }

    if (profile.trial_used) {
      return { label: "Free", detail: "Trial already used. Upgrade to unlock premium again." };
    }

    return { label: "Free", detail: "No active premium access. You can start a 7-day free trial." };
  }, [profile]);

  const isPremiumPlan =
    profile?.plan === "premium" || profile?.plan === "premium_monthly" || profile?.plan === "premium_yearly";

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const hashError = params.get("error_description") || params.get("error");
    if (hashError) {
      setError(String(hashError));
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, "/account");
      }
      setSessionLoading(false);
      return;
    }
    const accessToken = params.get("access_token") || "";
    if (!accessToken) return;
    const flowType = params.get("type") || "";
    const refreshToken = params.get("refresh_token") || "";
    const supabase = supabaseRef.current;
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setSession(data.session ?? null);
        setStatus("Signed in successfully.");
        setStatusType("success");
        setError("");
        if (flowType === "recovery") {
          setPasswordStage("ready");
          setIsRecoveryFlow(true);
          setStatus("Password verification complete. Please set a new password below.");
          setStatusType("info");
        }
        void refreshCurrentUser(data.session ?? null);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, "/account");
        }
        setSessionLoading(false);
      });
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session) {
        setStatus("Session restored.");
        setStatusType("info");
        void refreshCurrentUser(data.session).finally(() => setSessionLoading(false));
      } else {
        setSessionLoading(false);
      }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const planParam = new URLSearchParams(window.location.search).get("plan");
    if (planParam === "yearly") {
      setPreferredPlan("yearly");
    } else if (planParam === "monthly") {
      setPreferredPlan("monthly");
    }
  }, []);

  async function fetchEntitlement(activeSession: AuthSession | null) {
    if (!activeSession?.access_token) return;
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
      setStatusType("success");
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
          created_at: String(profile.created_at || ""),
          user_metadata: (profile.user_metadata as Record<string, unknown>) || {},
          app_metadata: (profile.app_metadata as Record<string, unknown>) || {},
          identities: (profile.identities as Array<Record<string, unknown>>) || [],
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
        setStatusType("info");
        setError("");
        return;
      }
      setError(message);
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
      setProfile(null);
      saveSession(null);
      setAvatarPreview("");
      setPasswordStage("idle");
      setIsRecoveryFlow(false);
      setStatus("Signed out.");
      setStatusType("info");
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
        setStatusType("success");
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
    setPasswordError("");
    if (!session?.access_token) return;
    if (!newPassword || !confirmPassword || (!isRecoveryFlow && !currentPassword)) {
      setPasswordError("Please complete all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }
    if (isWeakPassword(newPassword)) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (!isRecoveryFlow && newPassword === currentPassword) {
      setPasswordError("New password must be different from the current password.");
      return;
    }
    if (!user?.email && !isRecoveryFlow) {
      setPasswordError("Missing account email. Please sign in again.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let updateToken = session.access_token;
      if (!isRecoveryFlow) {
        const verifiedSession = (await supabaseRequest("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: JSON.stringify({ email: user?.email || "", password: currentPassword }),
        })) as AuthSession;
        updateToken = verifiedSession?.access_token || session.access_token;
      }
      await supabaseRequest(
        "/auth/v1/user",
        {
          method: "PUT",
          body: JSON.stringify({ password: newPassword }),
        },
        updateToken
      );
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setStatus("Password updated.");
      setStatusType("success");
      setPasswordStage("idle");
      setIsRecoveryFlow(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password update failed.";
      if (isRateLimited(message)) {
        setError("Too many attempts. Please wait and try again.");
        return;
      }
      if (isNetworkError(message)) {
        setError("Network error. Please try again.");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function requestPasswordChange() {
    if (!isPasswordEligible) {
      setError(`Password changes are managed by your ${providerLabel} sign-in.`);
      return;
    }
    if (!user?.email) {
      setError("Please sign in before requesting a password change.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/account` : undefined;
      await supabaseRequest("/auth/v1/recover", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          ...(redirectTo ? { redirect_to: redirectTo } : {}),
        }),
      });
      setPasswordStage("requested");
      setIsRecoveryFlow(false);
      setStatus("Password verification email sent. Check your inbox to continue.");
      setStatusType("info");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send verification email.";
      if (isRateLimited(message)) {
        setError("Too many requests. Please wait before trying again.");
        return;
      }
      if (isNetworkError(message)) {
        setError("Network error. Please try again.");
        return;
      }
      setError(message);
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
          <h2 className="text-lg font-semibold text-slate-900">Sign in required</h2>
          <p className="mt-2 text-sm text-slate-600">Redirecting you to the sign in page...</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
              <p className="mt-1 text-sm text-slate-600">Review your plan, account details, and security settings.</p>
            </div>
            {status ? (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  statusType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-sky-200 bg-sky-50 text-sky-800"
                }`}
              >
                {status}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Billing</h3>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{accountSummary.label}</p>
                    <p className="mt-1 text-xs text-slate-600">{accountSummary.detail}</p>
                    {profile?.premium_until ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Next billing date: {new Date(profile.premium_until).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
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
                </div>
                {isPremiumPlan && profile?.is_premium_active ? (
                  <div className="mt-3">
                    <a
                      href="/support"
                      className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Manage subscription
                    </a>
                  </div>
                ) : null}
              </div>

              {!isPremiumPlan ? <PaddleCheckoutCard defaultPlan={preferredPlan} /> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {(avatarPreview || avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview || avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                    <p className="text-sm font-semibold text-slate-900">{user?.email || "-"}</p>
                    <p className="text-xs text-slate-500">Sign-in method: {providerLabel}</p>
                    <p className="text-xs text-slate-500">
                      Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                  Upload avatar
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Security</h3>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  Password: ••••••••
                </div>
                {!isPasswordEligible ? (
                  <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Password changes are managed by your {providerLabel} sign-in.
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={requestPasswordChange}
                      disabled={loading || !signedIn}
                      className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
                    >
                      Change password
                    </button>
                    {passwordStage === "requested" ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Verification email sent. Open the link to continue.
                      </p>
                    ) : null}
                  </>
                )}

                {passwordStage === "ready" && isPasswordEligible ? (
                  <form className="mt-4 space-y-3" onSubmit={onUpdatePassword}>
                    {!isRecoveryFlow ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Current password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          required
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        New password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    {passwordError ? (
                      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {passwordError}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
                    >
                      Update Password
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            >
              Sign Out
            </button>
          </div>
        </section>
      )}

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
