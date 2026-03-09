import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepFocus Time",
  description:
    "DeepFocus Time is a Chrome extension for focus sessions, mindful breaks, and premium productivity tools.",
  verification: {
    google: "7XocHl_VCVvA2uAt1DGlfz8jCYVnnnjxwVhRkW4ahR8",
  },
  icons: {
    icon: [
      { url: "/deepfocus-favicon.png", sizes: "128x128", type: "image/png" },
      { url: "/deepfocus-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/deepfocus-favicon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/deepfocus-favicon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/deepfocus-favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteHeader />
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
              <Link href="/support" className="hover:text-slate-900">
                Support
              </Link>
              <Link href="/contact" className="hover:text-slate-900">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
