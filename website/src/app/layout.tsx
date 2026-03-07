import type { Metadata } from "next";
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
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              DeepFocus Time
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-700">
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
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
