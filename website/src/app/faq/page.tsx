import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about the DeepFocus Time Chrome focus timer extension, trials, and premium features.",
};

const faqs = [
  {
    q: "What does DeepFocus Time do?",
    a: "It is a Chrome extension that helps you run structured focus and break sessions with reliable controls and optional advanced automation.",
  },
  {
    q: "Who is DeepFocus Time for?",
    a: "It is designed for students, remote workers, and professionals who spend most of their workday inside Chrome.",
  },
  {
    q: "Do I need an account to use it?",
    a: "You can start with core functionality, and account sign-in helps sync your profile, trial state, and premium entitlement.",
  },
  {
    q: "What is included in Premium?",
    a: "Premium includes advanced settings such as distraction mute, idle auto-pause, meeting-aware auto-pause, and productivity-focused automation controls.",
  },
  {
    q: "How can I get support?",
    a: "Use the Support page or Contact form. Include clear steps and screenshots so we can troubleshoot faster.",
  },
];

export default function FaqPage() {
  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">FAQ</h1>
        <p className="mt-2 text-sm text-slate-600">Common questions about setup, plans, and day-to-day usage.</p>
      </header>

      <div className="space-y-4">
        {faqs.map((item) => (
          <section key={item.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-900">{item.q}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.a}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/support"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Visit Support
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Contact Us
        </Link>
      </div>
    </article>
  );
}
