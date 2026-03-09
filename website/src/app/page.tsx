import Link from "next/link";

const coreFeatures = [
  {
    title: "Focus timer that stays out of your way",
    description:
      "Start, pause, resume, and reset sessions quickly from the popup while keeping a clean workspace.",
  },
  {
    title: "Reliable session sync across tabs",
    description:
      "Your active session state stays consistent while you move between tasks and browser tabs.",
  },
  {
    title: "Advanced controls for serious focus",
    description:
      "Use premium settings such as distraction mute, idle auto-pause, and meeting-aware automation.",
  },
];

const useCases = [
  { role: "Students", note: "Plan study sprints and breaks without breaking concentration." },
  { role: "Remote workers", note: "Protect deep work blocks in busy browser-heavy workflows." },
  { role: "Builders", note: "Run stable coding sessions with predictable timer behavior." },
];

const steps = [
  "Install DeepFocus Time from the Chrome Web Store.",
  "Pin the extension and set your focus and break durations.",
  "Start a session and keep momentum with reminders and smart controls.",
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
        <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Chrome Extension for Intentional Work
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Focus deeper in Chrome with a timer built for real workdays.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in
          one lightweight extension.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://chromewebstore.google.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Add to Chrome
          </a>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Compare Plans
          </Link>
          <Link
            href="/account"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Start Free Trial
          </Link>
        </div>
        <div className="mt-6 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">No card needed to start trial</p>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">Built for focused browser workflows</p>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">Secure account auth with Supabase</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {coreFeatures.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/support"
            className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            View Setup Help
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Designed for people who work in Chrome</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {useCases.map((item) => (
              <p key={item.role} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="font-semibold text-slate-900">{item.role}:</span> {item.note}
              </p>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product preview</p>
            <p className="mt-2 text-sm text-slate-700">
              Popup controls for Focus/Break, reminders, keyboard shortcuts, and Advanced Settings are available from a
              single compact interface.
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Why teams choose DeepFocus Time</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Clear, practical feature set focused on daily execution instead of noisy dashboards.
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Consistent account state across extension and website for trial and premium management.
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Legal pages, support flow, and contact path ready for professional SaaS operations.
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Lightweight UX built to reduce friction before, during, and after each focus session.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Ready to improve focus consistency?</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Install the extension, run your first session, and refine your setup with features that match your workflow.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://chromewebstore.google.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Add to Chrome
          </a>
          <Link
            href="/faq"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Read FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}

// redeploy trigger

// deploy-check
