import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "See what the DeepFocus Time team is building next.",
};

const roadmap = [
  {
    stage: "Now",
    points: [
      "Strengthen onboarding for first-time extension users.",
      "Improve support documentation and issue triage quality.",
    ],
  },
  {
    stage: "Next",
    points: [
      "Publish deeper productivity guidance for weekly focus planning.",
      "Expand account insights around consistency and interruption trends.",
    ],
  },
  {
    stage: "Later",
    points: [
      "Add broader self-serve documentation for advanced workflows.",
      "Improve team-level productivity support options.",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Roadmap</h1>
        <p className="mt-2 text-sm text-slate-600">What we are working on to improve focus outcomes for users.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {roadmap.map((block) => (
          <section key={block.stage} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-900">{block.stage}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
              {block.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
