import AuthFormClient from "@/components/AuthFormClient";

export const metadata = {
  title: "Update Password",
  description: "Set a new password for your DeepFocus Time account.",
};

export default function UpdatePasswordPage() {
  return <AuthFormClient mode="update" />;
}
