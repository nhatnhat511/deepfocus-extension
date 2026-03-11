"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
  const [showResend, setShowResend] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

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
    if (!signedIn) return;
    // Keep auth pages accessible for logged-in users; UI will show a guidance message.
  }, [signedIn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode !== "update") return;
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
        router.replace("/account");
      } else {
        const identities = Array.isArray(data?.user?.identities) ? data.user.identities : [];
        if (identities.length === 0) {
          setError("Email already registered. Please sign in instead.");
          setShowResend(true);
          setPendingEmail(email.trim());
        } else {
          setStatus("Account created. Check your email to confirm within 24 hours.");
          setStatusType("info");
          setPendingEmail(email.trim());
          setShowResend(true);
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
        setShowResend(true);
        setPendingEmail(email.trim());
        return;
      }
      if (isEmailNotConfirmed(message)) {
        setStatus("Please confirm your email within 24 hours. You can resend the confirmation email below.");
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
      router.replace("/account");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      if (isRateLimited(message)) return setError("Too many attempts. Please wait and try again.");
      if (isNetworkError(message)) return setError("Network error. Please try again.");
      if (isInvalidCredentials(message)) return setError("Incorrect email or password.");
      if (isUserNotFound(message)) return setError("No account found for this email.");
      if (isEmailNotConfirmed(message)) {
        setStatus("Please confirm your email within 24 hours. You can resend the confirmation email below.");
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
      const supabase = supabaseRef.current;
      const redirectTo = `${window.location.origin}/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
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

  async function onSignOut() {
    if (!session?.access_token) {
      setSession(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = supabaseRef.current;
      await supabase.auth.signOut();
    } catch {
      // ignore logout network errors
    } finally {
      setSession(null);
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
      setStatus("Confirmation email resent. Please check your inbox.");
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
    const supabase = supabaseRef.current;
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">{headline}</h1>
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

        {signedIn && (mode === "login" || mode === "signup") ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p>You are already logged in.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/account"
                className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                Go to account
              </a>
              <button
                type="button"
                onClick={onSignOut}
                disabled={loading}
                className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              >
                {loading ? "Signing out..." : "Log out"}
              </button>
            </div>
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

        {showResend ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              {pendingEmail
                ? `We can resend the confirmation email to ${pendingEmail}.`
                : "Need a new confirmation email?"}
            </p>
            <button
              type="button"
              onClick={resendConfirmationEmail}
              disabled={resendLoading}
              className="mt-3 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-60"
            >
              {resendLoading ? "Sending..." : "Resend confirmation email"}
            </button>
          </div>
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
