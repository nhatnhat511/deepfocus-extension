import Link from "next/link";

const freeFeatures = [
  "Focus and break timer controls",
  "Session start, pause, resume, and reset",
  "Keyboard shortcuts support",
  "Lunch and evening break reminders",
  "Sound on/off toggle",
  "Drag-and-drop timer box anywhere on the page",
];

const premiumFeatures = [
  "All features included in the Free plan",
  "Night Work Mode with adjustable strength",
  "Focus Blur for the timer box",
  "Break Visual Tab with a customizable background",
  "Mute Distracting Sites during Focus sessions",
  "Idle Auto-Pause with minute-based threshold",
  "Daily Focus Goal tracking",
  "Weekly Overview mini chart",
  "Best Focus Hours analysis",
  "Interruption Rate diagnostics",
  "Smart Insight with weekly recommendations",
  "Auto-pauses the timer when Meet, Zoom, or Teams tabs are active",
  "Future premium feature upgrades",
  "Priority, friendly customer support",
];

const compareRows = [
  ["Focus & break timer", "Included", "Included"],
  ["Start / pause / resume / reset", "Included", "Included"],
  ["Keyboard shortcuts", "Included", "Included"],
  ["Lunch & evening break reminders", "Included", "Included"],
  ["Sound toggle + draggable timer box", "Included", "Included"],
  ["Night Work Mode + Focus Blur", "Not included", "Included"],
  ["Break Visual Tab + custom background", "Not included", "Included"],
  ["Mute distracting sites", "Not included", "Included"],
  ["Idle Auto-Pause (minutes)", "Not included", "Included"],
  ["Daily goal + weekly insights", "Not included", "Included"],
  ["Meeting auto-pause (Meet/Zoom/Teams)", "Not included", "Included"],
  ["Support", "Standard", "Priority"],
];

function renderAvailability(value: string) {
  const text = value.trim();
  if (text.toLowerCase() === "included") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <span aria-hidden="true" className="text-xl leading-none">✓</span>
        <span className="text-slate-700">{text}</span>
      </span>
    );
  }
  if (text.toLowerCase() === "not included") {
    return (
      <span className="inline-flex items-center gap-1 text-rose-600">
        <span aria-hidden="true" className="text-xl leading-none">✕</span>
        <span className="text-slate-700">{text}</span>
      </span>
    );
  }
  if (text.toLowerCase() === "standard" || text.toLowerCase() === "priority") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <span aria-hidden="true" className="text-xl leading-none">✓</span>
        <span className="text-slate-700">{text}</span>
      </span>
    );
  }
  return text;
}

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Simple plans for focused work
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Pricing</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Start free, then upgrade when you need advanced protection and automation for your focus sessions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">For individuals</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-1 text-sm text-slate-600">Run reliable daily focus sessions with essential controls.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">$0</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {freeFeatures.map((item) => (
              <li key={item}>{item}</li>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">For deep-focus professionals</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Premium</h2>
          <p className="mt-1 text-sm text-slate-600">Unlock advanced controls for fewer interruptions and better consistency.</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            $1.99<span className="text-base">/month</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">Auto-renews. Cancel anytime.</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {premiumFeatures.map((item) => (
              <li key={item}>{item}</li>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Feature comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-semibold">Capability</th>
                <th className="py-2 pr-4 font-semibold">Free</th>
                <th className="py-2 font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row[0]} className="border-b border-slate-100 text-slate-700">
                  <td className="py-2 pr-4">{row[0]}</td>
                  <td className="py-2 pr-4">{renderAvailability(row[1])}</td>
                  <td className="py-2">{renderAvailability(row[2])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Need help choosing?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Start on Free and move to Premium when you need advanced session automation and stronger focus protection.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/faq"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Read FAQ
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
