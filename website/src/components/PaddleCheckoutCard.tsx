"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

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

type WebsiteSession = {
  access_token?: string;
  user?: {
    id?: string;
    email?: string;
  };
};

const SESSION_KEY = "deepfocusWebsiteSession";

export default function PaddleCheckoutCard() {
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
  const paddleEnv = (process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox") as "sandbox" | "production";

  const canCheckout = useMemo(() => {
    return ready && paddleToken && !!accessToken && /^\S+@\S+\.\S+$/.test(email.trim()) && !loading;
  }, [accessToken, email, loading, paddleToken, ready]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as WebsiteSession;
      const token = String(session?.access_token || "");
      const userEmail = String(session?.user?.email || "");
      if (token) setAccessToken(token);
      if (userEmail) setEmail(userEmail);
    } catch {
      return;
    }
  }, []);

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
    if (!accessToken) {
      setError("Please sign in on the Account page before upgrading.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Unable to resolve your account email. Please sign in again.");
      return;
    }
    if (!window.Paddle) {
      setError("Checkout is not ready yet. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      initPaddleIfNeeded();

      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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

      window.Paddle.Checkout.open({
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

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-slate-800">Premium account email</label>
        <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
          {email || "Not signed in"}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Premium maps to your signed-in DeepFocus account.
        </p>
        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        <button
          type="button"
          onClick={startCheckout}
          disabled={!canCheckout}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Opening checkout..." : "Upgrade to Premium"}
        </button>
      </div>
    </>
  );
}
