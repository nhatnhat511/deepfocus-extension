import type { Metadata } from "next";
import { getPublicChangelog } from "@/lib/cms/publicContent.server";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements for DeepFocus Time.",
};

const changes = [
  {
    date: "March 2026",
    items: [
      "Onboarding now opens the signup page after extension install for faster activation.",
      "Refined signup messaging to align with premium activation and account benefits.",
      "Expanded FAQ, roadmap, changelog, privacy policy, and terms for a more complete SaaS experience.",
    ],
  },
  {
    date: "February 2026",
    items: [
      "Expanded premium advanced settings for distraction muting, idle auto-pause, meeting auto-pause, and daily goals.",
      "Polished account status handling and premium entitlement checks in the extension.",
    ],
  },
  {
    date: "January 2026",
    items: [
      "Introduced weekly focus summaries, interruption rate tracking, and smart insights.",
      "Added best focus hours insights to help users identify their strongest work windows.",
    ],
  },
];

export default async function ChangelogPage() {
  const cmsChanges = await getPublicChangelog();
  const entries =
    cmsChanges.length > 0
      ? cmsChanges.map((entry) => ({
          date: entry.release_date
            ? new Date(entry.release_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : entry.title,
          items: Array.isArray(entry.items) ? entry.items : [],
        }))
      : changes;

  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Changelog</h1>
        <p className="mt-2 text-sm text-slate-600">Product updates and notable improvements.</p>
      </header>

      <div className="space-y-4">
        {entries.map((entry) => (
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
