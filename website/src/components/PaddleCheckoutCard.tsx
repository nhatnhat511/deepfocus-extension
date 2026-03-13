"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

declare global {
  interface Window {
    Paddle?: {
      Environment?: { set: (env: "sandbox" | "production") => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: {
        open: (opts: {
          transactionId: string;
          settings?: {
            displayMode?: "overlay";
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}

let paddleInitialized = false;

type CreateCheckoutResponse = {
  transactionId: string;
  accountEmail?: string;
};

type PlanOption = "monthly" | "yearly";

type PaddleCheckoutCardProps = {
  defaultPlan?: PlanOption;
  allowedPlans?: PlanOption[];
  currentPlan?: string;
  subscriptionId?: string | null;
  accountEmail?: string;
  accountAccessToken?: string;
  accountUserId?: string;
  onCheckoutStart?: (summary: { plan: PlanOption | "upgrade_yearly" }) => void;
  onUpgradeSuccess?: (summary: { amountText?: string; plan?: PlanOption | "upgrade_yearly" }) => void;
};

const monthlyPrice = 2.99;
const yearlyDiscountRate = 0.3;
const yearlyBase = monthlyPrice * 12;
const yearlyFinal = yearlyBase * (1 - yearlyDiscountRate);
const yearlyPriceLabel = yearlyFinal.toFixed(2);
const pendingCheckoutKey = "df_pending_checkout";

type PendingCheckout = {
  plan: PlanOption | "upgrade_yearly";
  startedAt: number;
};

export default function PaddleCheckoutCard({
  defaultPlan = "monthly",
  allowedPlans,
  currentPlan,
  subscriptionId,
  accountEmail,
  accountAccessToken,
  accountUserId,
  onCheckoutStart,
  onUpgradeSuccess,
}: PaddleCheckoutCardProps) {
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<PlanOption>(defaultPlan);
  const [userId, setUserId] = useState("");
  const supabaseRef = useRef(createSupabaseBrowserClient());

  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
  const paddleEnv = (process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox") as "sandbox" | "production";
  const missingPaddleToken = !paddleToken;

  const normalizedAllowedPlans = useMemo<PlanOption[]>(
    () => (allowedPlans && allowedPlans.length > 0 ? allowedPlans : ["monthly", "yearly"]),
    [allowedPlans]
  );

  const canCheckout = useMemo(() => {
    return (
      ready &&
      paddleToken &&
      !!accessToken &&
      /^\S+@\S+\.\S+$/.test(email.trim()) &&
      !loading &&
      normalizedAllowedPlans.includes(plan)
    );
  }, [accessToken, email, loading, paddleToken, ready, normalizedAllowedPlans, plan]);
  const isMonthlyUpgradeToYearly = currentPlan === "premium_monthly" && plan === "yearly";
  const isActiveMonthly = currentPlan === "premium_monthly";
  const isActiveYearly = currentPlan === "premium_yearly";

  useEffect(() => {
    if (accountAccessToken) {
      setAccessToken(accountAccessToken);
    }
    if (accountEmail) {
      setEmail(accountEmail);
    }
    if (accountUserId) {
      setUserId(accountUserId);
    }
  }, [accountAccessToken, accountEmail, accountUserId]);

  useEffect(() => {
    if (accountAccessToken || accountEmail || accountUserId) return;
    const supabase = supabaseRef.current;
    const applySession = (session: { access_token?: string; user?: { email?: string; id?: string } } | null) => {
      setAccessToken(String(session?.access_token || ""));
      if (session?.user?.email) {
        setEmail(String(session.user.email));
      }
      if (session?.user?.id) {
        setUserId(String(session.user.id));
      }
    };
    supabase.auth.getSession().then(async ({ data }) => {
      applySession(data.session);
      if (data.session?.access_token) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          setEmail(String(userData.user.email));
        }
        if (userData?.user?.id) {
          setUserId(String(userData.user.id));
        }
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (normalizedAllowedPlans.includes(defaultPlan)) {
      setPlan(defaultPlan);
      return;
    }
    setPlan(normalizedAllowedPlans[0] ?? "monthly");
  }, [defaultPlan, normalizedAllowedPlans]);

  function initPaddleIfNeeded() {
    if (!window.Paddle || paddleInitialized || !paddleToken) return;
    if (paddleEnv === "sandbox" && window.Paddle.Environment?.set) {
      window.Paddle.Environment.set("sandbox");
    }
    window.Paddle.Initialize({ token: paddleToken });
    paddleInitialized = true;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (ready) return;
    if (window.Paddle) {
      setReady(true);
      initPaddleIfNeeded();
    }
  }, [ready]);

  function writePendingCheckout(nextPlan: PendingCheckout["plan"]) {
    if (typeof window === "undefined") return;
    try {
      const payload: PendingCheckout = {
        plan: nextPlan,
        startedAt: Date.now(),
      };
      window.localStorage.setItem(pendingCheckoutKey, JSON.stringify(payload));
    } catch {
      // ignore storage failures
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

  async function startCheckout() {
    setError("");
    setErrorCode("");
    setSuccess("");
    if (!accessToken) {
      setError("Please sign in on the Account page before upgrading.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Unable to resolve your account email. Please sign in again.");
      return;
    }
    if (isMonthlyUpgradeToYearly && !subscriptionId) {
      setError("Missing subscription details. Please refresh and try again.");
      return;
    }
    if (plan === "yearly" && currentPlan === "premium_yearly") {
      setError("You are already on Premium Yearly.");
      return;
    }
    if (plan === "monthly" && isActiveMonthly) {
      setError("You already have an active Monthly plan. It will renew automatically.");
      return;
    }
    if (!window.Paddle && !isMonthlyUpgradeToYearly) {
      setError("Checkout is not ready yet. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      if (isMonthlyUpgradeToYearly) {
        const upgradeStartedAt = Date.now();
        writePendingCheckout("upgrade_yearly");
        if (onCheckoutStart) {
          onCheckoutStart({ plan: "upgrade_yearly" });
        }
        const res = await fetch("/api/paddle/upgrade-subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = (await res.json().catch(() => ({}))) as { error?: string; code?: string; detail?: string };
        if (!res.ok) {
          setErrorCode(String(payload?.code || ""));
          const msg = payload?.error || "Upgrade request failed.";
          const detail = payload?.detail ? ` (${payload.detail})` : "";
          throw new Error(`${msg}${detail}`);
        }
        const syncRes = await fetch("/api/paddle/sync-subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const syncPayload = (await syncRes.json().catch(() => ({}))) as { plan?: string };
        if (!syncRes.ok || syncPayload.plan !== "premium_yearly") {
          setSuccess("Upgrade submitted. Please refresh in a moment to see the updated plan.");
          if (onUpgradeSuccess) {
            onUpgradeSuccess({ amountText: "", plan: "upgrade_yearly" });
          }
          return;
        }

        writePendingCheckout("upgrade_yearly");

        let amountText = "";
        try {
          const latestRes = await fetch("/api/paddle/latest-transaction", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const latestPayload = (await latestRes.json().catch(() => ({}))) as {
            amount?: string;
            currency?: string;
            createdAt?: string;
          };
          if (latestRes.ok && latestPayload?.amount) {
            const currency = String(latestPayload.currency || "").toUpperCase();
            const rawAmount = String(latestPayload.amount);
            const isPlainDigits = /^\d+$/.test(rawAmount);
            const createdAt = latestPayload.createdAt ? Date.parse(latestPayload.createdAt) : NaN;
            const isAfterUpgrade = Number.isFinite(createdAt)
              ? createdAt >= upgradeStartedAt - 2 * 60 * 1000
              : false;
            if (!isAfterUpgrade) {
              amountText = "";
            } else {
              let numeric = Number(isPlainDigits ? Number(rawAmount) / 100 : rawAmount);
              if (!Number.isFinite(numeric)) {
                amountText = "";
              } else if (numeric > 1000) {
                // Avoid showing an incorrect amount when units are unclear.
                amountText = "";
              } else if (currency) {
                try {
                  amountText = new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency,
                    minimumFractionDigits: 2,
                  }).format(numeric);
                } catch {
                  amountText = `${numeric.toFixed(2)} ${currency}`;
                }
              }
            }
          }
        } catch {
          // ignore transaction lookup failures
        }
        const successMsg = amountText
          ? `Upgrade successful. Amount paid: ${amountText}.`
          : "Upgrade successful. Your account is now Premium Yearly.";
        setSuccess(successMsg);
        if (onUpgradeSuccess) {
          onUpgradeSuccess({ amountText, plan: "upgrade_yearly" });
        }
        return;
      }

      initPaddleIfNeeded();

      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), plan, userId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Checkout request failed (${res.status})`);
      }

      const payload = (await res.json()) as CreateCheckoutResponse;
      if (!payload.transactionId) {
        throw new Error("Missing transaction id.");
      }
      if (payload.accountEmail && payload.accountEmail !== email.trim().toLowerCase()) {
        setEmail(payload.accountEmail);
      }
      writePendingCheckout(plan);
      if (onCheckoutStart) {
        onCheckoutStart({ plan });
      }
      window.Paddle?.Checkout.open({
        transactionId: payload.transactionId,
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/checkout/success?plan=${plan}`,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to start checkout.";
      clearPendingCheckout();
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/paddle/create-portal-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        setError(payload?.error || "Unable to open billing portal.");
        return;
      }
      if (payload?.url) {
        window.open(payload.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Unable to open billing portal.");
    }
  }

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => {
          setReady(true);
          initPaddleIfNeeded();
        }}
      />

      <div className="mt-5 rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-slate-50 p-4 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-slate-800">Premium account email</label>
        <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
          {email || "Not signed in"}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Premium maps to your signed-in DeepFocus account.
        </p>
        <div className="mt-4" id="billing-plan">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing plan</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              disabled={!normalizedAllowedPlans.includes("monthly")}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm ${
                plan === "monthly"
                  ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-pressed={plan === "monthly"}
            >
              Monthly plan — ${monthlyPrice.toFixed(2)} per month
            </button>
            <button
              type="button"
              onClick={() => setPlan("yearly")}
              disabled={!normalizedAllowedPlans.includes("yearly")}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm ${
                plan === "yearly"
                  ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-pressed={plan === "yearly"}
            >
              Yearly plan (30% off) — ${yearlyPriceLabel} per year
            </button>
          </div>
        </div>
        {missingPaddleToken ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Billing is temporarily unavailable. Please contact support.
          </p>
        ) : null}
        {success ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={startCheckout}
          disabled={!canCheckout}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Processing..." : "Upgrade to Premium"}
        </button>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-base text-slate-700">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M12 2a7 7 0 0 1 7 7v3h1a2 2 0 0 1 2 2v8h-8v-2h6v-6H4v6h6v2H2v-8a2 2 0 0 1 2-2h1V9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5v3h10V9a5 5 0 0 0-5-5"
              />
            </svg>
            Secure checkout
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-slate-600">
              <path
                fill="currentColor"
                d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25Zm2.75-.25a.75.75 0 0 0-.75.75v.5h14v-.5a.75.75 0 0 0-.75-.75Zm13.25 4H5v6.75c0 .41.34.75.75.75h12.5a.75.75 0 0 0 .75-.75Z"
              />
            </svg>
            Encrypted payments
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-slate-600">
              <path
                fill="currentColor"
                d="M12 3a9 9 0 1 1-9 9a9 9 0 0 1 9-9m1 5h-2v5.25l4.25 2.55 1-1.64-3.25-1.96Z"
              />
            </svg>
            Cancel anytime
          </span>
        </div>
      </div>
    </>
  );
}
