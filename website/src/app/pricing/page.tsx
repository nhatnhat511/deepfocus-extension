import Link from "next/link";

const freeFeatures = [
  "Focus and break timer",
  "Start, pause, resume, and reset controls",
  "Lunch and evening break reminders",
  "Account sync across extension and website",
];

const premiumFeatures = [
  "Distraction mute for selected domains",
  "Idle auto-pause and meeting-aware auto-pause",
  "Night work mode and focus blur controls",
  "Break visual tab customization",
  "Daily focus goal and progress tracking",
  "Keyboard shortcuts and premium automation",
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pricing</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose the plan that fits your workflow. You can start with Free and upgrade anytime.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-1 text-sm text-slate-600">For personal focus sessions and daily routine tracking.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {freeFeatures.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <Link
            href="/account"
            className="mt-6 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Continue with Free
          </Link>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Premium</h2>
          <p className="mt-1 text-sm text-slate-600">For advanced automation and deeper focus protection.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$4.99<span className="text-base">/month</span></p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {premiumFeatures.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <Link
            href="/account"
            className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Upgrade to Premium
          </Link>
        </article>
      </section>
    </div>
  );
}

