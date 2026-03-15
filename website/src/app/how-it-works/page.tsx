import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it Works",
  description: "Install DeepFocus Time and start focused sessions in minutes.",
};

function ChromeIcon() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center">
      <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
        <path fill="#EA4335" d="M24 4a20 20 0 0 1 17.32 10H24Z" />
        <path fill="#FBBC05" d="M41.32 14A20 20 0 0 1 44 24H24Z" />
        <path fill="#34A853" d="M44 24a20 20 0 0 1-7.07 15.27L24 24Z" />
        <path fill="#4285F4" d="M36.93 39.27A20 20 0 0 1 24 44V24Z" />
        <path fill="#EA4335" d="M24 44A20 20 0 0 1 6.68 34H24Z" />
        <path fill="#FBBC05" d="M6.68 34A20 20 0 0 1 4 24h20Z" />
        <path fill="#34A853" d="M4 24A20 20 0 0 1 11.07 8.73L24 24Z" />
        <path fill="#4285F4" d="M11.07 8.73A20 20 0 0 1 24 4v20Z" />
        <circle cx="24" cy="24" r="9" fill="#ffffff" />
        <circle cx="24" cy="24" r="6.2" fill="#4285F4" />
      </svg>
    </span>
  );
}

const steps = [
  {
    title: "Install DeepFocus Time",
    detail: "Get the extension from the Chrome Web Store and pin it to your toolbar for quick access.",
  },
  {
    title: "Set your focus and break times",
    detail: "Choose the session and break lengths that match your workflow and energy.",
  },
  {
    title: "Start a focus session",
    detail: "Hit start and keep the timer visible while you work to stay on track.",
  },
  {
    title: "Use smart controls",
    detail: "Enable reminders, meeting auto-pause, idle pause, and distraction muting as needed.",
  },
  {
    title: "Sync your account",
    detail: "Sign in to unlock trial access, premium features, and session history.",
  },
];

export default function HowItWorksPage() {
  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">How it Works</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set up DeepFocus Time in minutes and build a reliable focus routine.
        </p>
      </header>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                {index + 1}
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">{step.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link
          href="https://chromewebstore.google.com/"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <ChromeIcon />
          Add to Chrome
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          View Pricing
        </Link>
      </div>
    </article>
  );
}
