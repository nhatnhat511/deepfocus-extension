"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type WebsiteSession = {
  access_token?: string;
  user?: {
    id?: string;
  };
};

const SESSION_KEY = "deepfocusWebsiteSession";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) {
        setSignedIn(false);
        return;
      }
      const session = JSON.parse(raw) as WebsiteSession;
      const hasSession = !!(session?.access_token && session?.user?.id);
      setSignedIn(hasSession);
    } catch {
      setSignedIn(false);
    }
  }, []);

  const accountIcon = signedIn ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 19.5c1.8-3.2 4.7-4.8 7.5-4.8s5.7 1.6 7.5 4.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 19.5c1.6-3 4.2-4.6 6.5-4.6" />
      <path d="M16 7v6" />
      <path d="M13 10h6" />
    </svg>
  );

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
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
              href="/account"
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
              className="h-8 w-auto"
              priority
            />
            <span className="text-base font-bold tracking-tight text-slate-900">DeepFocus Time</span>
          </Link>

          <Link
            href="/account"
            aria-label={signedIn ? "Account" : "Sign in or sign up"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            {accountIcon}
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-2 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
