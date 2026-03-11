import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your DeepFocus Time account, profile, and billing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
