"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User, UserIdentity } from "@supabase/auth-js";
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
  paddle_status?: string | null;
  paddle_subscription_id?: string | null;
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

function isExpiredTokenError(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("token is expired") || text.includes("jwt expired");
}

function isSessionMissingError(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("session_id") && text.includes("does not exist");
}

export default function AccountPage() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const router = useRouter();
  const [status, setStatus] = useState("Not signed in.");
  const [statusType, setStatusType] = useState<"info" | "success">("info");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [preferredPlan, setPreferredPlan] = useState<"monthly" | "yearly">("monthly");
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingMeta, setBillingMeta] = useState<{
    status?: string;
    nextBilledAt?: string | null;
    currentPeriodEndsAt?: string | null;
    scheduledAction?: string;
    scheduledEffectiveAt?: string | null;
  } | null>(null);
  const [billingMetaLoading, setBillingMetaLoading] = useState(false);
  const syncAttemptedRef = useRef(false);
  const loginRetryRef = useRef(false);
  const pollingRef = useRef<number | null>(null);

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
  const fallbackAvatar = useMemo(() => {
    if (authProvider !== "email") return "";
    const seed = user?.id || user?.email || "deepfocus";
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      seed
    )}&radius=50&backgroundColor=ecfdf5&textColor=0f766e`;
  }, [authProvider, user]);

  const providerLabel = useMemo(() => {
    if (!authProvider) return "Email";
    if (authProvider === "email") return "Email";
    return authProvider.charAt(0).toUpperCase() + authProvider.slice(1);
  }, [authProvider]);

  const canManagePassword = authProvider === "email";

  const inferredPlan = useMemo(() => {
    if (!profile) return "free";
    if (profile.plan === "trial") return "trial";
    const untilTs = profile.premium_until ? Date.parse(profile.premium_until) : NaN;
    const remainingDays = Number.isFinite(untilTs) ? (untilTs - Date.now()) / (1000 * 60 * 60 * 24) : NaN;
    if (Number.isFinite(remainingDays)) {
      if (remainingDays >= 200) return "premium_yearly";
      if (remainingDays >= 10) return profile.plan === "free" ? "free" : "premium_monthly";
    }
    return profile.plan || "free";
  }, [profile]);

  const accountSummary = useMemo(() => {
    if (!profile) return { label: "Free", detail: "No active premium access." };
    const now = Date.now();
    const untilTs = profile.premium_until ? Date.parse(profile.premium_until) : 0;
    const activePremium = !!(untilTs && Number.isFinite(untilTs) && untilTs > now);
    const isPremium =
      profile.plan === "premium" || profile.plan === "premium_monthly" || profile.plan === "premium_yearly";
    const premiumLabel =
      inferredPlan === "premium_yearly" ? "Premium (Yearly)" : "Premium (Monthly)";

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
  }, [profile, inferredPlan]);
  const isCanceledSubscription = useMemo(() => {
    const status = String(profile?.paddle_status || "").toLowerCase();
    return status === "canceled" || status === "cancelled";
  }, [profile?.paddle_status]);
  const hasScheduledCancel = useMemo(() => {
    const action = String(billingMeta?.scheduledAction || "").toLowerCase();
    return action === "cancel" || action === "cancelled";
  }, [billingMeta?.scheduledAction]);

  const isPremiumPlan =
    inferredPlan === "premium" || inferredPlan === "premium_monthly" || inferredPlan === "premium_yearly";
  const currentPlan = inferredPlan || "free";
  const isTrialActive = !!profile?.is_trial_active;
  const canStartTrial = currentPlan === "free" && !profile?.trial_used;
  const canUpgradeMonthly = currentPlan === "free" || isTrialActive;
  const canUpgradeYearly =
    currentPlan === "free" || isTrialActive || currentPlan === "premium" || currentPlan === "premium_monthly";
  const isYearlyPlan = currentPlan === "premium_yearly";
  const pendingCheckoutKey = "df_pending_checkout";

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
    if (signedIn) return;
    if (loginRetryRef.current) {
      router.replace("/login");
      return;
    }
    loginRetryRef.current = true;
    const supabase = supabaseRef.current;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        void refreshCurrentUser(data.session);
      } else {
        router.replace("/login");
      }
    });
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
    const baseProfile = row as ProfileRow;
    try {
      const meta = (await supabaseRequest(
        `/rest/v1/profiles?select=paddle_status,paddle_subscription_id&id=eq.${encodeURIComponent(activeSession.user.id)}&limit=1`,
        { method: "GET" },
        activeSession.access_token
      )) as Array<{ paddle_status?: string | null; paddle_subscription_id?: string | null }>;
      const paddleStatus = meta?.[0]?.paddle_status ?? null;
      const paddleSubscriptionId = meta?.[0]?.paddle_subscription_id ?? null;
      setProfile({ ...baseProfile, paddle_status: paddleStatus, paddle_subscription_id: paddleSubscriptionId });
    } catch {
      setProfile(baseProfile);
    }
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
      const raw = profile as Record<string, unknown>;
      const appMeta = (raw.app_metadata as Record<string, unknown>) || {};
      const userMeta = (raw.user_metadata as Record<string, unknown>) || {};
      const identities = Array.isArray(raw.identities) ? (raw.identities as UserIdentity[]) : [];
      const updatedUser: User = {
        id: String(raw.id || ""),
        aud: typeof raw.aud === "string" ? raw.aud : "authenticated",
        created_at: String(raw.created_at || ""),
        app_metadata: appMeta,
        user_metadata: userMeta,
        identities,
        email: typeof raw.email === "string" ? raw.email : undefined,
        phone: typeof raw.phone === "string" ? raw.phone : undefined,
        confirmed_at: typeof raw.confirmed_at === "string" ? raw.confirmed_at : undefined,
        email_confirmed_at: typeof raw.email_confirmed_at === "string" ? raw.email_confirmed_at : undefined,
        phone_confirmed_at: typeof raw.phone_confirmed_at === "string" ? raw.phone_confirmed_at : undefined,
        last_sign_in_at: typeof raw.last_sign_in_at === "string" ? raw.last_sign_in_at : undefined,
        role: typeof raw.role === "string" ? raw.role : undefined,
        updated_at: typeof raw.updated_at === "string" ? raw.updated_at : undefined,
        is_anonymous: typeof raw.is_anonymous === "boolean" ? raw.is_anonymous : undefined,
        is_sso_user: typeof raw.is_sso_user === "boolean" ? raw.is_sso_user : undefined,
      };
      const updated: AuthSession = {
        ...activeSession,
        user: updatedUser,
      };
      setSession(updated);
      await fetchEntitlement(updated);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Session refresh failed.";
      if (isSessionMissingError(message)) {
        setSession(null);
        setProfile(null);
        setStatus("Session expired. Please sign in again.");
        setStatusType("info");
        setError("");
        router.replace("/login");
        return;
      }
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
      await supabaseRef.current.auth.signOut();
    } catch {
      // ignore network/logout errors and continue cleanup
    } finally {
      setSession(null);
      setProfile(null);
      setAvatarPreview("");
      setStatus("Signed out.");
      setStatusType("info");
      setLoading(false);
      router.replace("/login");
    }
  }

  async function openManageSubscription() {
    if (!session?.access_token) {
      setError("Please sign in again to manage your subscription.");
      return;
    }
    setError("");
    setPortalLoading(true);
    try {
      const res = await fetch("/api/paddle/create-portal-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to open subscription portal.");
      }
      if (payload?.url) {
        window.open(payload.url, "_blank", "noopener,noreferrer");
        return;
      }
      throw new Error("Missing portal URL.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open subscription portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function refreshBillingMeta() {
    if (!session?.access_token || !profile?.paddle_subscription_id) return;
    setBillingMetaLoading(true);
    try {
      const res = await fetch("/api/paddle/subscription-status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = (await res.json().catch(() => ({}))) as {
        status?: string;
        nextBilledAt?: string | null;
        currentPeriodEndsAt?: string | null;
        scheduledChange?: { action?: string; effectiveAt?: string | null } | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to refresh billing status.");
      }
      setBillingMeta({
        status: payload.status || "",
        nextBilledAt: payload.nextBilledAt ?? null,
        currentPeriodEndsAt: payload.currentPeriodEndsAt ?? null,
        scheduledAction: payload.scheduledChange?.action || "",
        scheduledEffectiveAt: payload.scheduledChange?.effectiveAt ?? null,
      });
    } catch {
      // keep current UI if refresh fails
    } finally {
      setBillingMetaLoading(false);
    }
  }

  function readPendingCheckout() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(pendingCheckoutKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { plan?: string; startedAt?: number };
      const startedAt = Number(parsed?.startedAt || 0);
      if (!Number.isFinite(startedAt) || startedAt <= 0) {
        window.localStorage.removeItem(pendingCheckoutKey);
        return null;
      }
      const ageMinutes = (Date.now() - startedAt) / (1000 * 60);
      if (ageMinutes > 30) {
        window.localStorage.removeItem(pendingCheckoutKey);
        return null;
      }
      return { plan: String(parsed?.plan || ""), startedAt };
    } catch {
      return null;
    }
  }

  function clearPendingCheckout() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(pendingCheckoutKey);
    } catch {
      // ignore storage failures
    }
  }

  function stopPolling() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function pollUserPlan(expectedPlans: string[]) {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/user", { method: "GET", cache: "no-store" });
      const payload = (await res.json().catch(() => ({}))) as {
        entitlement?: { plan?: string } | null;
      };
      const plan = String(payload?.entitlement?.plan || "");
      if (res.ok && plan && expectedPlans.includes(plan)) {
        stopPolling();
        clearPendingCheckout();
        await refreshCurrentUser(session);
        await refreshBillingMeta();
      }
    } catch {
      // ignore polling errors
    }
  }

  function startPolling(expectedPlans: string[]) {
    if (typeof window === "undefined") return;
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(() => {
      void pollUserPlan(expectedPlans);
    }, 2000);
    void pollUserPlan(expectedPlans);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!signedIn || !profile?.paddle_subscription_id) return;
    const handleFocus = () => {
      void refreshBillingMeta();
      if (
        profile?.plan === "premium" ||
        profile?.plan === "premium_monthly"
      ) {
        void fetch("/api/paddle/sync-subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
        }).then((res) => {
          if (res.ok) {
            void refreshCurrentUser(session);
          }
        });
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [signedIn, profile?.paddle_subscription_id, profile?.plan, session?.access_token, session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!signedIn || !session?.access_token) return;
    const pending = readPendingCheckout();
    if (!pending) return;
    const plan = pending.plan;
    const expectedPlans =
      plan === "upgrade_yearly" || plan === "yearly"
        ? ["premium_yearly"]
        : ["premium_monthly", "premium_yearly", "premium"];
    startPolling(expectedPlans);
    return () => {
      stopPolling();
    };
  }, [signedIn, session?.access_token]);

  useEffect(() => {
    if (!signedIn || !session?.access_token) return;
    if (!profile) return;
    if (syncAttemptedRef.current) return;
    syncAttemptedRef.current = true;
    const syncNow = async () => {
      try {
        const res = await fetch("/api/paddle/sync-subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (res.ok) {
          await refreshCurrentUser(session);
        }
      } catch {
        // ignore sync failures; webhook will catch up
      }
    };
    void syncNow();
  }, [signedIn, session?.access_token, profile]);

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4m0 2c-4.42 0-8 2-8 4.5V20h16v-1.5c0-2.5-3.58-4.5-8-4.5"
              />
            </svg>
          </span>
          Account
        </h1>
        <p className="mt-2 text-sm text-slate-600">Manage your DeepFocus account, login, and profile settings.</p>
      </section>

      {!signedIn && !sessionLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Sign in required</h2>
          <p className="mt-2 text-sm text-slate-600">Redirecting you to the sign in page...</p>
        </section>
      ) : sessionLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Loading account</h2>
          <p className="mt-2 text-sm text-slate-600">Fetching your account details...</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4m6 8H6a2 2 0 0 1-2-2v-1.5C4 14.57 7.13 13 12 13s8 1.57 8 3.5V18a2 2 0 0 1-2 2"
                    />
                  </svg>
                </span>
                Profile
              </h2>
              <p className="mt-1 text-sm text-slate-600">Review your plan, account details, and security settings.</p>
            </div>
            {status && statusType === "success" && !status.toLowerCase().includes("session") ? (
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
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25Zm2.75-.25a.75.75 0 0 0-.75.75v.5h14v-.5a.75.75 0 0 0-.75-.75Zm13.25 4H5v6.75c0 .41.34.75.75.75h12.5a.75.75 0 0 0 .75-.75Z"
                    />
                  </svg>
                </span>
                Billing
              </h3>
              <div className="mt-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{accountSummary.label}</p>
                    <p className="mt-1 text-xs text-slate-600">{accountSummary.detail}</p>
                    {profile?.premium_until ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {(() => {
                          if (profile.plan === "trial") {
                            return (
                              <>
                                Trial ends on: {new Date(profile.premium_until).toLocaleDateString()}
                              </>
                            );
                          }
                          const scheduledTs = billingMeta?.scheduledEffectiveAt
                            ? Date.parse(billingMeta.scheduledEffectiveAt)
                            : NaN;
                          const premiumUntilTs = Date.parse(profile.premium_until);
                          const isScheduleAligned =
                            Number.isFinite(scheduledTs) &&
                            Number.isFinite(premiumUntilTs) &&
                            Math.abs(scheduledTs - premiumUntilTs) <= 3 * 24 * 60 * 60 * 1000;
                          const showAccessEnds = (hasScheduledCancel || isCanceledSubscription) && (!isYearlyPlan || isScheduleAligned);
                          const displayDate = showAccessEnds
                            ? (billingMeta?.scheduledEffectiveAt ||
                              billingMeta?.currentPeriodEndsAt ||
                              profile.premium_until)
                            : (isYearlyPlan
                              ? profile.premium_until
                              : (billingMeta?.nextBilledAt || profile.premium_until));
                          return (
                            <>
                              {showAccessEnds ? "Access ends on" : "Next billing date"}:{" "}
                              {new Date(displayDate).toLocaleDateString()}
                            </>
                          );
                        })()}
                        {billingMetaLoading ? " (updating...)" : ""}
                      </p>
                    ) : null}
                  </div>
                  {canStartTrial ? (
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
                    <button
                      type="button"
                      onClick={openManageSubscription}
                      disabled={portalLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
                        <path
                          fill="currentColor"
                          d="M12 8a4 4 0 1 0 4 4a4 4 0 0 0-4-4m9 3h-2.07a7 7 0 0 0-1.2-2.9l1.46-1.46-1.42-1.42-1.46 1.46A7 7 0 0 0 13 5.07V3h-2v2.07a7 7 0 0 0-2.9 1.2L6.64 4.8 5.22 6.22l1.46 1.46A7 7 0 0 0 5.07 11H3v2h2.07a7 7 0 0 0 1.2 2.9L4.8 17.36l1.42 1.42 1.46-1.46A7 7 0 0 0 11 18.93V21h2v-2.07a7 7 0 0 0 2.9-1.2l1.46 1.46 1.42-1.42-1.46-1.46A7 7 0 0 0 18.93 13H21Z"
                        />
                      </svg>
                      {portalLoading ? "Opening portal..." : "Manage subscription"}
                    </button>
                  </div>
                ) : null}
              </div>

              {!isYearlyPlan ? (
                <PaddleCheckoutCard
                  defaultPlan={preferredPlan}
                  currentPlan={currentPlan}
                  subscriptionId={profile?.paddle_subscription_id || null}
                  onUpgradeSuccess={({ plan }) => {
                    const expectedPlans =
                      plan === "upgrade_yearly" || plan === "yearly"
                        ? ["premium_yearly"]
                        : ["premium_monthly", "premium_yearly", "premium"];
                    startPolling(expectedPlans);
                  }}
                  allowedPlans={
                    canUpgradeMonthly && canUpgradeYearly
                      ? ["monthly", "yearly"]
                      : canUpgradeYearly
                        ? ["yearly"]
                        : ["monthly"]
                  }
                />
              ) : (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  You are on the highest plan (Premium Yearly).
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                        <path
                          fill="currentColor"
                          d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4m6 8H6a2 2 0 0 1-2-2v-1.5C4 14.57 7.13 13 12 13s8 1.57 8 3.5V18a2 2 0 0 1-2 2"
                        />
                      </svg>
                    </span>
                    Profile
                  </h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {(avatarPreview || avatarUrl || fallbackAvatar) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview || avatarUrl || fallbackAvatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
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

              {canManagePassword ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Security</h3>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    Password: ********
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="/change-password"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Change password
                    </a>
                    <a
                      href="/forgot-password?from=account"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Forgot password
                    </a>
                  </div>
                </div>
              ) : null}
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M12 3a9 9 0 1 0 9 9a9 9 0 0 0-9-9m0 2a7 7 0 0 1 6.93 6H13.5a1.5 1.5 0 0 0 0 3H18.93A7 7 0 1 1 12 5"
              />
            </svg>
          </span>
          Get the Chrome Extension
        </h2>
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
