import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://deepfocustime.com"),
  title: {
    default: "DeepFocus Time | Chrome Focus Timer Extension",
    template: "%s | DeepFocus Time",
  },
  description:
    "DeepFocus Time is a Chrome extension for focused work sessions, mindful breaks, and advanced productivity controls.",
  keywords: [
    "chrome focus timer extension",
    "pomodoro chrome extension",
    "productivity extension",
    "focus sessions",
    "deep work timer",
  ],
  verification: {
    google: "7XocHl_VCVvA2uAt1DGlfz8jCYVnnnjxwVhRkW4ahR8",
  },
  openGraph: {
    title: "DeepFocus Time",
    description:
      "Stay focused with a clean Chrome extension for sessions, breaks, and advanced productivity settings.",
    url: "https://deepfocustime.com",
    siteName: "DeepFocus Time",
    type: "website",
    images: [{ url: "/deepfocus-favicon.png", width: 512, height: 512, alt: "DeepFocus Time logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepFocus Time",
    description:
      "A Chrome extension for focused work, mindful breaks, and reliable productivity workflows.",
    images: ["/deepfocus-favicon.png"],
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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BJ38FV6W6D"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-BJ38FV6W6D');`,
          }}
        />
      </head>
      <body className="antialiased">
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
      </body>
    </html>
  );
}
