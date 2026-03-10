import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact DeepFocus Time support for help with setup, billing, or account questions.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
