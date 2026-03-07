import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-10">
        <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Chrome Extension for Intentional Work
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          DeepFocus Time keeps your focus sessions clear, calm, and consistent.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Focus timer, break reminders, tab sync, and premium automation tools in one lightweight extension.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://chrome.google.com/webstore"
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
            View Pricing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Focus and break timer</h2>
          <p className="mt-2 text-sm text-slate-600">
            Start, pause, resume, and reset sessions with clean controls inside the extension popup.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Multi-tab session sync</h2>
          <p className="mt-2 text-sm text-slate-600">
            Keep timer state aligned across active tabs so your workflow stays predictable.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Premium automation</h2>
          <p className="mt-2 text-sm text-slate-600">
            Unlock advanced settings like distraction mute, idle auto-pause, and meeting-aware controls.
          </p>
        </article>
      </section>
    </div>
  );
}
