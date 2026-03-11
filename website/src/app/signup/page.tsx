import AuthFormClient from "@/components/AuthFormClient";

export const metadata = {
  title: "Create Account",
  description: "Create a DeepFocus Time account to sync sessions and unlock premium features.",
};

export default function SignupPage() {
  return <AuthFormClient mode="signup" />;
}
