"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createClient } from "@supabase/supabase-js";

type AuthMode = "login" | "signup" | "forgot" | "update";


function isEmailNotConfirmed(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("email not confirmed") || text.includes("not confirmed");
}

function isAlreadyRegistered(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("already registered") || text.includes("user already") || text.includes("already exists");
}

function isNetworkError(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("failed to fetch") || text.includes("network") || text.includes("timeout");
}

function isRateLimited(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("rate limit") || text.includes("too many") || text.includes("429");
}

function isInvalidCredentials(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("invalid login") || text.includes("invalid credentials");
}

function isUserNotFound(message: string) {
  const text = String(message || "").toLowerCase();
  return text.includes("user not found") || text.includes("not found");
}

function isWeakPassword(value: string) {
  return value.length > 0 && value.length < 8;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AuthFormClient({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const recoveryClientRef = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr",
      {
        auth: {
          flowType: "implicit",
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )
  );
  const oauthClientRef = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr",
      {
        auth: {
          flowType: "pkce",
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )
  );
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabaseRef.current.auth.getSession>>["data"]["session"] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success">("info");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const signedIn = !!(session?.access_token && session?.user?.id);

  const headline = useMemo(() => {
    switch (mode) {
      case "signup":
        return "Create your account";
      case "forgot":
        return "Reset your password";
      case "update":
        return "Set a new password";
      default:
        return "Welcome back";
    }
  }, [mode]);

  const headlineIcon = useMemo(() => {
    switch (mode) {
      case "signup":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M15 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4m-9 7v-1.5C6 15.01 10.03 13 15 13c.7 0 1.37.04 2 .12V11h2v2h2v2h-2v2h-2v-2h-.74c-3.1 0-6.26 1.23-6.26 2.5V19Z"
            />
          </svg>
        );
      case "forgot":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M7 10a5 5 0 1 1 8.9 3H20v8h-6v-3H8v3H2v-8h3.1A4.98 4.98 0 0 1 7 10m0 0a3 3 0 1 0 6 0a3 3 0 0 0-6 0"
            />
          </svg>
        );
      case "update":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 1 7 7v3h1a2 2 0 0 1 2 2v8h-8v-2h6v-6H4v6h6v2H2v-8a2 2 0 0 1 2-2h1V9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5v3h10V9a5 5 0 0 0-5-5"
            />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M12 3a5 5 0 0 1 5 5v2h1a2 2 0 0 1 2 2v9H4v-9a2 2 0 0 1 2-2h1V8a5 5 0 0 1 5-5m-3 7h6V8a3 3 0 0 0-6 0Z"
            />
          </svg>
        );
    }
  }, [mode]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (typeof window !== "undefined" && (mode === "login" || mode === "signup")) {
      const { hash, search } = window.location;
      const query = new URLSearchParams(search);
      if ((hash && hash.includes("access_token")) || query.get("code")) {
        setSessionLoading(false);
        setSessionVerified(true);
        return;
      }
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setSession(null);
        setSessionLoading(false);
        setSessionVerified(true);
        return;
      }
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(data.session);
      }
      setSessionLoading(false);
      setSessionVerified(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionLoading || !sessionVerified) return;
    if (!signedIn) return;
    if (mode === "login" || mode === "signup") {
      if (typeof window !== "undefined") {
        window.location.replace("/account");
      } else {
        router.replace("/account");
      }
    }
  }, [signedIn, mode, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode !== "update") return;
    setError("");
    setStatus("");
    const hash = window.location.hash;
    const supabase = supabaseRef.current;
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const hashError = params.get("error_description") || params.get("error");
      if (hashError) {
        setError(String(hashError));
        setRecoveryReady(false);
        window.history.replaceState({}, document.title, "/update-password");
        setSessionLoading(false);
        return;
      }
      const accessToken = params.get("access_token") || "";
      if (!accessToken) {
        setRecoveryReady(false);
        setSessionLoading(false);
        return;
      }
      const refreshToken = params.get("refresh_token") || "";
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session) {
            setError(error?.message || "Invalid or expired reset link.");
            setRecoveryReady(false);
          } else {
            setSession(data.session);
            setRecoveryReady(true);
            setStatus("Verification complete. Set your new password.");
            setStatusType("info");
          }
          window.history.replaceState({}, document.title, "/update-password");
          setSessionLoading(false);
        });
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const tokenHash = query.get("token_hash") || query.get("token");
    const flowType = query.get("type") || "recovery";

    if (tokenHash && flowType) {
      supabase.auth
        .verifyOtp({ type: flowType as "recovery", token_hash: tokenHash })
        .then(({ data, error }) => {
          if (error || !data.session) {
            setError(error?.message || "Invalid or expired reset link.");
            setRecoveryReady(false);
          } else {
            setSession(data.session);
            setRecoveryReady(true);
            setStatus("Verification complete. Set your new password.");
            setStatusType("info");
          }
          window.history.replaceState({}, document.title, "/update-password");
          setSessionLoading(false);
        });
      return;
    }

    if (!code) {
      setError("");
      setRecoveryReady(false);
      setSessionLoading(false);
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error || !data.session) {
        const msg = error?.message || "Invalid or expired reset link.";
        if (msg.toLowerCase().includes("code verifier")) {
          setError("Reset link must be opened in the same browser you requested it from. Please request a new link.");
        } else {
          setError(msg);
        }
        setRecoveryReady(false);
      } else {
        setSession(data.session);
        setRecoveryReady(true);
        setStatus("Verification complete. Set your new password.");
        setStatusType("info");
      }
      window.history.replaceState({}, document.title, "/update-password");
      setSessionLoading(false);
    });
  }, [mode]);

  async function onSignUp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!email.trim()) return setError("Please enter your email.");
    if (!isValidEmail(email.trim())) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter a password.");
    if (isWeakPassword(password)) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (checkResponse.ok) {
        const checkPayload = (await checkResponse.json().catch(() => ({}))) as {
          exists?: boolean;
          provider?: string;
          confirmed?: boolean;
        };
        if (checkPayload?.exists) {
          const provider = String(checkPayload?.provider || "email").toLowerCase();
          if (provider && provider !== "email") {
            setError(`This email is already registered with ${provider} sign-in.`);
            return;
          }
          if (checkPayload?.confirmed === false) {
            setStatus("Please verify your email to activate your account.");
            setStatusType("info");
            setShowResend(true);
            setPendingEmail(email.trim());
            return;
          }
          setError("This email is already registered. Please sign in instead.");
          return;
        }
      }

      const supabase = supabaseRef.current;
      const emailRedirectTo = `${window.location.origin}/auth/confirm`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      });
      if (signUpError) throw new Error(signUpError.message);

      if (data.session) {
        setSession(data.session);
        setStatus("Account created and signed in.");
        setStatusType("success");
        setShowResend(false);
        setPendingEmail("");
        if (typeof window !== "undefined") {
          window.location.replace("/account");
        } else {
          router.replace("/account");
        }
      } else {
        const identities = Array.isArray(data?.user?.identities) ? data.user.identities : [];
        if (identities.length === 0) {
          setError("Email already registered. Please sign in instead.");
        } else {
          setStatus("Account created. Check your email to confirm within 24 hours.");
          setStatusType("info");
          setShowResend(true);
          setPendingEmail(email.trim());
        }
      }
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed.";
      if (isRateLimited(message)) return setError("Too many attempts. Please wait and try again.");
      if (isNetworkError(message)) return setError("Network error. Please try again.");
      if (isAlreadyRegistered(message)) {
        setError("Email already registered. Please sign in instead.");
        return;
      }
      if (isEmailNotConfirmed(message)) {
        setStatus("Please verify your email to activate your account.");
        setStatusType("info");
        setShowResend(true);
        setPendingEmail(email.trim());
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!email.trim()) return setError("Please enter your email.");
    if (!isValidEmail(email.trim())) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    setLoading(true);
    try {
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (checkResponse.ok) {
        const checkPayload = (await checkResponse.json().catch(() => ({}))) as {
          exists?: boolean;
          provider?: string;
          confirmed?: boolean;
        };
        if (checkPayload?.exists && checkPayload?.confirmed === false) {
          setStatus("Please verify your email to activate your account.");
          setStatusType("info");
          setShowResend(true);
          setPendingEmail(email.trim());
          return;
        }
      }

      const supabase = supabaseRef.current;
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error(signInError.message);
      if (!data.session) throw new Error("Session creation failed.");
      setSession(data.session);
      setStatus("Signed in successfully.");
      setStatusType("success");
      setShowResend(false);
      setPendingEmail("");
      setPassword("");
      if (typeof window !== "undefined") {
        window.location.replace("/account");
      } else {
        router.replace("/account");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      if (isRateLimited(message)) return setError("Too many attempts. Please wait and try again.");
      if (isNetworkError(message)) return setError("Network error. Please try again.");
      if (isInvalidCredentials(message)) return setError("Incorrect email or password.");
      if (isUserNotFound(message)) return setError("No account found for this email.");
      if (isEmailNotConfirmed(message)) {
        setStatus("Please verify your email to activate your account.");
        setStatusType("info");
        setShowResend(true);
        setPendingEmail(email.trim());
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!email.trim()) return setError("Please enter your email.");
    if (!isValidEmail(email.trim())) return setError("Please enter a valid email address.");
    setLoading(true);
    try {
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!checkResponse.ok) {
        const payload = (await checkResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload?.error || "Unable to verify email.");
      }
      const checkPayload = (await checkResponse.json().catch(() => ({}))) as {
        exists?: boolean;
        provider?: string;
        confirmed?: boolean;
      };
      if (!checkPayload?.exists) {
        setError("No account found for this email.");
        return;
      }
      const provider = String(checkPayload?.provider || "email").toLowerCase();
      if (provider && provider !== "email") {
        setError(`This email uses ${provider} sign-in. Please use ${provider} to access your account.`);
        return;
      }
      if (checkPayload?.confirmed === false) {
        setStatus("Please verify your email to activate your account before resetting your password.");
        setStatusType("info");
        setShowResend(true);
        setPendingEmail(email.trim());
        return;
      }

      const redirectTo = `${window.location.origin}/update-password`;
      // Use implicit flow for recovery to avoid PKCE code verifier mismatches
      const { error: resetError } = await recoveryClientRef.current.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw new Error(resetError.message);
      setStatus("Password reset email sent. Check your inbox to continue.");
      setStatusType("info");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send password reset email.";
      if (isRateLimited(message)) return setError("Too many requests. Please wait before trying again.");
      if (isNetworkError(message)) return setError("Network error. Please try again.");
      if (isUserNotFound(message)) return setError("No account found for this email.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdatePassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!recoveryReady || !session?.access_token) {
      setError("Verification required. Please open the reset link from your email.");
      return;
    }
    if (!newPassword || !confirmNewPassword) return setError("Please complete both password fields.");
    if (newPassword !== confirmNewPassword) return setError("The new passwords do not match.");
    if (isWeakPassword(newPassword)) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const supabase = supabaseRef.current;
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);
      setStatus("Password updated. You can sign in now.");
      setStatusType("success");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password update failed.";
      if (isRateLimited(message)) return setError("Too many attempts. Please wait and try again.");
      if (isNetworkError(message)) return setError("Network error. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmationEmail() {
    const targetEmail = pendingEmail || email.trim();
    if (!targetEmail) {
      setError("Please enter your email first.");
      return;
    }
    setError("");
    setResendLoading(true);
    try {
      const supabase = supabaseRef.current;
      const emailRedirectTo = `${window.location.origin}/auth/confirm`;
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: { emailRedirectTo },
      });
      if (resendError) throw new Error(resendError.message);
      setStatus("Confirmation email resent. Please check your inbox and spam folder.");
      setStatusType("info");
      setShowResend(true);
      setPendingEmail(targetEmail);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to resend confirmation email.";
      if (isRateLimited(msg)) return setError("Too many requests. Please wait before trying again.");
      if (isNetworkError(msg)) return setError("Network error. Please try again.");
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  }


  function startOAuth(provider: "google" | "github") {
    if (typeof window === "undefined") return;
    const supabase = oauthClientRef.current;
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            {headlineIcon}
          </span>
          {headline}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "signup"
            ? "Create your account to sync DeepFocus Time across devices."
            : mode === "forgot"
              ? "Enter your account email to receive a reset link."
              : mode === "update"
                ? "Set a new password for your account."
                : "Sign in to manage your DeepFocus account."}
        </p>

        {sessionLoading ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Checking session...
          </p>
        ) : null}
        {mode === "update" && !sessionLoading && !recoveryReady ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Verification link missing or expired. Please request a new reset link.
          </p>
        ) : null}
        {error && !(mode === "update" && recoveryReady) ? (
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
        {showResend ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p>
              Didn't receive the email?{" "}
              <button
                type="button"
                onClick={resendConfirmationEmail}
                disabled={resendLoading}
                className="font-semibold text-emerald-600 hover:underline disabled:opacity-60"
              >
                Click here to resend
              </button>
              .
            </p>
            <p className="mt-2 text-xs text-slate-500">Please also check your spam or junk folder.</p>
          </div>
        ) : null}

        {mode === "signup" && !signedIn ? (
          <form className="mt-6 space-y-4" onSubmit={onSignUp}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                disabled={loading}
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
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        ) : null}

        {mode === "login" && !signedIn ? (
          <form className="mt-6 space-y-4" onSubmit={onSignIn}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                disabled={loading}
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
                disabled={loading}
                required
              />
              <div className="flex items-center justify-end text-xs text-slate-500">
                <a href="/forgot-password" className="text-emerald-600 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : null}

        {(mode === "login" || mode === "signup") ? (
          <>
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
          </>
        ) : null}

        {mode === "forgot" ? (
          <form className="mt-6 space-y-4" onSubmit={onForgotPassword}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        ) : null}

        {mode === "update" && recoveryReady ? (
          <form className="mt-6 space-y-4" onSubmit={onUpdatePassword}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
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
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                disabled={loading}
                required
              />
              {error ? (
                <p className="text-xs text-rose-600">{error}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : null}

      </section>

      {mode === "login" ? (
        <p className="text-center text-sm text-slate-600">
          New to DeepFocus?{" "}
          <a href="/signup" className="font-semibold text-emerald-600 hover:underline">
            Create an account
          </a>
        </p>
      ) : null}
      {mode === "signup" ? (
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign in
          </a>
        </p>
      ) : null}
      {mode === "forgot" ? (
        <p className="text-center text-sm text-slate-600">
          Remembered your password?{" "}
          <a href="/login" className="font-semibold text-emerald-600 hover:underline">
            Back to sign in
          </a>
        </p>
      ) : null}
      {mode === "update" ? (
        <p className="text-center text-sm text-slate-600">
          <a href="/forgot-password" className="font-semibold text-emerald-600 hover:underline">
            Request a new reset link
          </a>
          <span className="mx-2 text-slate-400">•</span>
          <a href="/login" className="font-semibold text-emerald-600 hover:underline">
            Return to sign in
          </a>
        </p>
      ) : null}
    </div>
  );
}
