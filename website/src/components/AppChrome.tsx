"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-6xl px-4 py-10">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-5 text-sm text-slate-600">
          <span>&copy; {new Date().getFullYear()} DeepFocus Time</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-slate-900">
              FAQ
            </Link>
            <Link href="/blog" className="hover:text-slate-900">
              Blog
            </Link>
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
            <Link href="/refund" className="hover:text-slate-900">
              Refund
            </Link>
            <Link href="/support" className="hover:text-slate-900">
              Support
            </Link>
            <Link href="/changelog" className="hover:text-slate-900">
              Changelog
            </Link>
            <Link href="/roadmap" className="hover:text-slate-900">
              Roadmap
            </Link>
            <Link href="/contact" className="hover:text-slate-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
