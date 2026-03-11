import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Success",
  description: "Completing your DeepFocus Time checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
