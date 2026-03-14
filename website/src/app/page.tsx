import type { Metadata } from "next";
import Link from "next/link";
import { getPublicHomeSections } from "@/lib/cms/publicContent.server";

export const metadata: Metadata = {
  title: {
    absolute: "DeepFocus Time | Chrome Focus Timer Extension",
  },
  description:
    "DeepFocus Time is a Chrome focus timer extension for deep work sessions, smart breaks, and productivity controls.",
};

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

function splitPipeText(value: string | null | undefined) {
  return (value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function Home() {
  const cmsSections = await getPublicHomeSections();
  const heroSection = cmsSections.find((section) => section.key === "hero");
  const heroHighlightsSection = cmsSections.find((section) => section.key === "hero-highlights");
  const ctaSection = cmsSections.find((section) => section.key === "cta");
  const featureSections = cmsSections.filter((section) => section.key.startsWith("feature"));
  const stepsSection = cmsSections.find((section) => section.key.startsWith("steps"));
  const audienceSection = cmsSections.find((section) => section.key.startsWith("audience"));
  const proofSection = cmsSections.find((section) => section.key.startsWith("proof"));
  const heroHighlights = splitPipeText(heroHighlightsSection?.subtitle);
  const stepItems = splitPipeText(stepsSection?.subtitle);
  const audienceItems = splitPipeText(audienceSection?.subtitle);
  const proofItems = splitPipeText(proofSection?.subtitle);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
        <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          {heroSection?.image_url || "Chrome Extension for Intentional Work"}
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {heroSection?.title || "Focus deeper in Chrome with a timer built for real workdays."}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          {heroSection?.subtitle ||
            "DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in one lightweight extension."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {heroSection?.cta_label && heroSection?.cta_href ? (
            <Link
              href={heroSection.cta_href}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              {heroSection.cta_label}
            </Link>
          ) : (
            <a
              href="https://chromewebstore.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Add to Chrome
            </a>
          )}
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
          {(heroHighlights.length
            ? heroHighlights
            : [
                "No card needed to start trial",
                "Built for focused browser workflows",
                "Secure account auth with Supabase",
              ]).map((item) => (
            <p key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {(featureSections.length
          ? featureSections.map((section) => ({
              title: section.title || section.key,
              description: section.subtitle || "Update this homepage block from the CMS admin.",
            }))
          : coreFeatures
        ).map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">{stepsSection?.title || "How it works"}</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {(stepItems.length ? stepItems : steps).map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link
            href={stepsSection?.cta_href || "/support"}
            className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            {stepsSection?.cta_label || "View Setup Help"}
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">{audienceSection?.title || "Designed for people who work in Chrome"}</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {(audienceItems.length
              ? audienceItems.map((item) => {
                  const [role, ...rest] = item.split(":");
                  return { role: role.trim(), note: rest.join(":").trim() };
                })
              : useCases).map((item) => (
              <p key={item.role} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="font-semibold text-slate-900">{item.role}:</span> {item.note}
              </p>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {audienceSection?.cta_label || "Product preview"}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {audienceSection?.image_url ||
                "Popup controls for Focus/Break, reminders, keyboard shortcuts, and Advanced Settings are available from a single compact interface."}
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {proofSection?.title || "Why teams choose DeepFocus Time"}
        </h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          {(proofItems.length
            ? proofItems
            : [
                "Clear, practical feature set focused on daily execution instead of noisy dashboards.",
                "Consistent account state across extension and website for trial and premium management.",
                "Legal pages, support flow, and contact path ready for professional SaaS operations.",
                "Lightweight UX built to reduce friction before, during, and after each focus session.",
              ]).map((item) => (
            <p key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {ctaSection?.title || "Ready to improve focus consistency?"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          {ctaSection?.subtitle ||
            "Install the extension, run your first session, and refine your setup with features that match your workflow."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {ctaSection?.cta_label && ctaSection?.cta_href ? (
            <Link
              href={ctaSection.cta_href}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              {ctaSection.cta_label}
            </Link>
          ) : (
            <a
              href="https://chromewebstore.google.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Add to Chrome
            </a>
          )}
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

// deploy-reset
