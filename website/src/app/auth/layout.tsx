import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Complete your DeepFocus Time authentication flow.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
