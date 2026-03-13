import AuthFormClient from "@/components/AuthFormClient";
import LoginRedirector from "@/components/LoginRedirector";

export const metadata = {
  title: "Sign In",
  description: "Sign in to manage your DeepFocus Time account and subscription.",
};

export default function LoginPage() {
  return (
    <>
      <LoginRedirector />
      <AuthFormClient mode="login" />
    </>
  );
}
