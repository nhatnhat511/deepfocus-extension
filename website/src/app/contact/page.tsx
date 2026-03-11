import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the DeepFocus Time team for account support, billing questions, or product feedback.",
};

export default function ContactPage() {
  return <ContactClient />;
}
