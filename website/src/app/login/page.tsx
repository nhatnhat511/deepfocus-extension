import AuthFormClient from "@/components/AuthFormClient";

export const metadata = {
  title: "Sign In",
  description: "Sign in to manage your DeepFocus Time account and subscription.",
};

export default function LoginPage() {
  return <AuthFormClient mode="login" />;
}
