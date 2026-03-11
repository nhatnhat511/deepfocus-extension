import type { Metadata } from "next";
import AuthConfirmClient from "./AuthConfirmClient";

export const metadata: Metadata = {
  title: "Email Verification",
  description: "Confirming your DeepFocus account email.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthConfirmPage() {
  return <AuthConfirmClient />;
}
