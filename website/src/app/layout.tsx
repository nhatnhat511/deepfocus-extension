import type { Metadata } from "next";
import AuthHashRedirect from "@/components/AuthHashRedirect";
import AppChrome from "@/components/AppChrome";
import { getPublicMenus } from "@/lib/cms/publicMenus.server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { headerMenu, footerMenu } = await getPublicMenus();

  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BJ38FV6W6D"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BJ38FV6W6D');
`,
          }}
        />
      </head>
      <body className="antialiased">
        <AuthHashRedirect />
        <AppChrome headerMenu={headerMenu} footerMenu={footerMenu}>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
