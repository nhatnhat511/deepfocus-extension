import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements for DeepFocus Time.",
};

const changes = [
  {
    date: "March 2026",
    items: [
      "Improved website structure with clearer SaaS positioning and onboarding sections.",
      "Enhanced pricing page clarity with plan comparison and use-case guidance.",
      "Expanded support, legal, and FAQ coverage for better customer trust.",
    ],
  },
  {
    date: "February 2026",
    items: [
      "Added premium-oriented advanced settings controls in the extension workflow.",
      "Improved account management pages and entitlement status visibility.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Changelog</h1>
        <p className="mt-2 text-sm text-slate-600">Product updates and notable improvements.</p>
      </header>

      <div className="space-y-4">
        {changes.map((entry) => (
          <section key={entry.date} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-900">{entry.date}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
