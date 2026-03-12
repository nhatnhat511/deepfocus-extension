"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/auth/callback")) {
      return;
    }
    const supabase = supabaseRef.current;
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!(data.session?.access_token && data.session?.user?.id);
      setSignedIn(hasSession);
      if (data.session?.access_token) {
        supabase.auth.getUser().then(({ error }) => {
          if (error) {
            const maybeStop = supabase.auth as typeof supabase.auth & { stopAutoRefresh?: () => void };
            if (maybeStop.stopAutoRefresh) maybeStop.stopAutoRefresh();
            supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
            setSignedIn(false);
          }
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (String(_event) === "TOKEN_REFRESH_FAILED") {
        const maybeStop = supabase.auth as typeof supabase.auth & { stopAutoRefresh?: () => void };
        if (maybeStop.stopAutoRefresh) maybeStop.stopAutoRefresh();
        supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        setSignedIn(false);
        return;
      }
      const hasSession = !!(nextSession?.access_token && nextSession?.user?.id);
      setSignedIn(hasSession);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [pathname]);

  const accountIcon = signedIn ? (
    <svg
      viewBox="0 0 24 24"
      className="h-[22px] w-[22px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21c0-3.2-3.6-5.6-8-5.6s-8 2.4-8 5.6" />
      <circle cx="12" cy="8" r="3.6" />
      <path d="M18 8.2h2.6" />
      <path d="M19.3 6.9v2.6" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className="h-[22px] w-[22px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21c0-3.2-3.6-5.6-8-5.6s-8 2.4-8 5.6" />
      <circle cx="12" cy="8" r="3.6" />
    </svg>
  );

  const accountHref = signedIn ? "/account" : "/login";

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="hidden min-h-16 items-center justify-between gap-3 md:flex">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-slate-900">
            <Image
              src="/logo-main.svg"
              alt="DeepFocus logo"
              width={44}
              height={44}
              className="h-8 w-auto sm:h-8 md:h-9"
              priority
            />
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">DeepFocus Time</span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700 md:flex">
              {navLinks.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href={accountHref}
              aria-label={signedIn ? "Account" : "Sign in or sign up"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              {accountIcon}
            </Link>
          </div>
        </div>

        <div className="flex min-h-16 items-center justify-between md:hidden">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700"
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Image
              src="/logo-main.svg"
              alt="DeepFocus logo"
              width={44}
              height={44}
              className="h-9 w-auto"
              priority
            />
            <span className="text-[1.05rem] font-bold tracking-tight text-slate-900">DeepFocus Time</span>
          </Link>

          <Link
            href={accountHref}
            aria-label={signedIn ? "Account" : "Sign in or sign up"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            {accountIcon}
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
          />
          <nav className="fixed left-0 top-0 z-50 h-full w-[68%] max-w-xs border-r border-slate-200 bg-white/95 px-4 py-6 shadow-2xl ring-1 ring-slate-200/70 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2.5 font-semibold hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
