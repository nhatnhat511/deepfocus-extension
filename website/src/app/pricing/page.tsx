export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Pricing</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Start free, then upgrade when you want automation and premium productivity tools.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-2 text-sm text-slate-600">Good for core focus sessions.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Focus timer and break timer</li>
            <li>Pause, resume, and reset controls</li>
            <li>Basic reminder settings</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-sky-300 bg-sky-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Premium</h2>
          <p className="mt-2 text-sm text-slate-600">For users who want automation and consistency.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$4.99/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Night work and adaptive comfort controls</li>
            <li>Distraction mute and custom blocked domains</li>
            <li>Idle auto-pause and meeting awareness</li>
          </ul>
          <button
            type="button"
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Upgrade with Paddle (coming next)
          </button>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Payment and billing confidence</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Checkout will be powered by Paddle.</li>
          <li>Billing status syncs to your DeepFocus account profile.</li>
          <li>Refund and terms policies are publicly accessible.</li>
        </ul>
      </section>
    </div>
  );
}
