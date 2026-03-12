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
  onUpgradeSuccess?: (summary: { amountText?: string }) => void;
};

const monthlyPrice = 2.99;
const yearlyDiscountRate = 0.3;
const yearlyBase = monthlyPrice * 12;
const yearlyFinal = yearlyBase * (1 - yearlyDiscountRate);
const yearlyPriceLabel = yearlyFinal.toFixed(2);

export default function PaddleCheckoutCard({
  defaultPlan = "monthly",
  allowedPlans,
  currentPlan,
  subscriptionId,
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
  const supabaseRef = useRef(createSupabaseBrowserClient());

  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
  const paddleEnv = (process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox") as "sandbox" | "production";

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
  const isMonthlyUpgradeToYearly =
    (currentPlan === "premium" || currentPlan === "premium_monthly") && plan === "yearly";

  useEffect(() => {
    const supabase = supabaseRef.current;
    const applySession = (session: { access_token?: string; user?: { email?: string } } | null) => {
      setAccessToken(String(session?.access_token || ""));
      if (session?.user?.email) {
        setEmail(String(session.user.email));
      }
    };
    supabase.auth.getSession().then(async ({ data }) => {
      applySession(data.session);
      if (data.session?.access_token) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          setEmail(String(userData.user.email));
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
    if (!window.Paddle && !isMonthlyUpgradeToYearly) {
      setError("Checkout is not ready yet. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      if (isMonthlyUpgradeToYearly) {
        const upgradeStartedAt = Date.now();
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
            onUpgradeSuccess({ amountText: "" });
          }
          return;
        }

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
          onUpgradeSuccess({ amountText });
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
        body: JSON.stringify({ email: email.trim().toLowerCase(), plan }),
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

      window.Paddle?.Checkout.open({
        transactionId: payload.transactionId,
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/checkout/success`,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to start checkout.";
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
        <div className="mt-4">
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
              Monthly — ${monthlyPrice.toFixed(2)}/mo
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
              Yearly (30% off) — ${yearlyPriceLabel}/yr
            </button>
          </div>
        </div>
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
          {loading
            ? "Processing..."
            : plan === "yearly"
              ? isMonthlyUpgradeToYearly
                ? "Switch to Yearly (Prorated)"
                : "Upgrade to Yearly"
              : "Upgrade to Premium"}
        </button>
      </div>
    </>
  );
}
