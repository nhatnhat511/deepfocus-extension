import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about the DeepFocus Time Chrome extension, accounts, and premium tools.",
};

const faqs = [
  {
    q: "What is DeepFocus Time?",
    a: "DeepFocus Time is a Chrome extension that helps you run focused work and intentional breaks with smart automation and on-page reminders.",
  },
  {
    q: "Who is it for?",
    a: "It is built for students, creators, and professionals who spend most of their workday in Chrome and want more consistent deep work.",
  },
  {
    q: "Do I need an account to use the extension?",
    a: "You can start with core timer features right away. An account is needed for premium tools, trial access, and account management.",
  },
  {
    q: "What does the focus and break timer do?",
    a: "Set focus and break lengths, start or pause sessions, and keep a clear rhythm throughout the day. Your session progress and streaks are tracked inside the extension.",
  },
  {
    q: "What is the on-page timer overlay?",
    a: "The overlay keeps your timer visible while you work so you can stay oriented without switching tabs.",
  },
  {
    q: "What are break reminders?",
    a: "Optional lunch and evening reminders can notify you to step away, helping you avoid long, unhealthy work streaks.",
  },
  {
    q: "What is Night Work Mode and Focus Blur?",
    a: "Night Work Mode dims bright pages and reduces glare at night. Focus Blur softens distracting pages during a focus session.",
  },
  {
    q: "How does Mute Distracting Sites work?",
    a: "When focus is active, selected domains (like social or video sites) are muted automatically. You control the list.",
  },
  {
    q: "What are Idle Auto-Pause and Meeting Auto-Pause?",
    a: "Idle Auto-Pause stops the timer when you step away. Meeting Auto-Pause pauses when a meeting tab is active (Meet, Zoom, Teams).",
  },
  {
    q: "What is included in Premium?",
    a: "Premium unlocks advanced automation and insights like distraction muting, meeting-aware pause, idle pause, focus blur, break visuals, and deeper stats.",
  },
  {
    q: "How do I start the free trial?",
    a: "Sign in on the website and start the 7-day trial from your account or the extension settings panel.",
  },
  {
    q: "How do I manage billing or cancel?",
    a: "You can manage billing from your account page. Cancel anytime; your premium access stays active until the period ends.",
  },
  {
    q: "How can I get support?",
    a: "Visit the Support or Contact page. Include steps to reproduce and screenshots if possible.",
  },
];

export default function FaqPage() {
  const items = faqs;

  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">FAQ</h1>
        <p className="mt-2 text-sm text-slate-600">Common questions about setup, plans, and day-to-day usage.</p>
      </header>

      <div className="space-y-4">
        {items.map((item) => (
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
