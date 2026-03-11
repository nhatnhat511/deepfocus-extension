import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extension Sign-in",
  description: "Completing your DeepFocus extension sign-in.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExtensionCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
