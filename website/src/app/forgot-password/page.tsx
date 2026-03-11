import AuthFormClient from "@/components/AuthFormClient";

export const metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your DeepFocus Time account.",
};

export default function ForgotPasswordPage() {
  return <AuthFormClient mode="forgot" />;
}
