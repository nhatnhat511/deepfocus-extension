export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Pricing</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          DeepFocus Time is free by default after installation from Chrome. Premium unlocks advanced automation at a fixed monthly price.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-2 text-sm text-slate-600">No account required to start.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Install and use immediately from Chrome</li>
            <li>Core focus and break timer workflow</li>
            <li>Basic reminders and timer sounds</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-sky-300 bg-sky-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Premium</h2>
          <p className="mt-2 text-sm text-slate-600">For users who want automation and consistency.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$4.99/mo</p>
          <p className="mt-1 text-sm text-slate-600">Auto-renewed monthly per account until canceled.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Night work visual comfort controls</li>
            <li>Distraction muting and custom blocked domains</li>
            <li>Idle and meeting-aware auto pause features</li>
          </ul>
          <button
            type="button"
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Upgrade with Paddle (coming next)
          </button>
        </article>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Feature comparison</h3>
        <table className="mt-4 min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2 pr-4 font-semibold">Feature</th>
              <th className="py-2 pr-4 font-semibold">Free</th>
              <th className="py-2 font-semibold">Premium</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Install from Chrome and use without account</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Start, pause, resume, and reset timer</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Custom focus and break durations</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Multi-tab session sync</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">In-page timer overlay support</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Countdown tick and transition sound alerts</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Lunch and evening reminder scheduling</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Reminder popup with dismiss and end-session actions</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Keyboard start, pause/resume, and reset commands</td>
              <td className="py-2 pr-4">Included</td>
              <td className="py-2">Included</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Break visual mode</td>
              <td className="py-2 pr-4">Limited</td>
              <td className="py-2">Unlocked</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Night Work Mode with smart dim strength</td>
              <td className="py-2 pr-4">Locked</td>
              <td className="py-2">Unlocked</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Distracting site mute with custom domain list</td>
              <td className="py-2 pr-4">Locked</td>
              <td className="py-2">Unlocked</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Idle auto-pause</td>
              <td className="py-2 pr-4">Locked</td>
              <td className="py-2">Unlocked</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Meeting-aware auto-pause (Meet/Zoom/Teams)</td>
              <td className="py-2 pr-4">Locked</td>
              <td className="py-2">Unlocked</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-4">Daily goal and streak tracking</td>
              <td className="py-2 pr-4">Basic</td>
              <td className="py-2">Advanced</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Account and premium plan sync</td>
              <td className="py-2 pr-4">Optional</td>
              <td className="py-2">Required for premium unlock</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Billing terms</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Premium is billed at $4.99 per month per account.</li>
          <li>Canceling stops future billing cycles.</li>
          <li>Charges already paid are non-refundable.</li>
          <li>Payment processing is provided by Paddle once checkout is enabled.</li>
        </ul>
      </section>
    </div>
  );
}
