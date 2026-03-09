import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepFocus Time",
  description:
    "DeepFocus Time is a Chrome extension for focus sessions, mindful breaks, and premium productivity tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-slate-900">
              <Image
                src="/logo-main.svg"
                alt="DeepFocus logo"
                width={44}
                height={44}
                className="h-7 w-auto sm:h-8 md:h-9"
                priority
              />
              <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">DeepFocus Time</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
              <Link href="/account" className="hover:text-slate-900">
                Account
              </Link>
              <Link href="/pricing" className="hover:text-slate-900">
                Pricing
              </Link>
              <Link href="/privacy" className="hover:text-slate-900">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-900">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-slate-900">
                Contact
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-6xl px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-slate-600">
            <span>© {new Date().getFullYear()} DeepFocus Time</span>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-900">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-900">
                Terms
              </Link>
              <Link href="/refund" className="hover:text-slate-900">
                Refund
              </Link>
              <Link href="/delete-data" className="hover:text-slate-900">
                Delete Data
              </Link>
              <Link href="/contact" className="hover:text-slate-900">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
