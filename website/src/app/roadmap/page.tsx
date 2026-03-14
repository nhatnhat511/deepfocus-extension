import type { Metadata } from "next";
import { getPublicRoadmap } from "@/lib/cms/publicContent.server";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Upcoming enhancements for the DeepFocus Time focus timer extension.",
};

const roadmap = [
  {
    stage: "Now",
    points: [
      "Streamline onboarding from install to account activation and free trial start.",
      "Expand focus insights with clearer weekly trends and interruption patterns.",
      "Refine break visuals and scheduled reminders for healthier work rhythms.",
      "Harden support workflows and self-serve troubleshooting coverage.",
    ],
  },
  {
    stage: "Next",
    points: [
      "Per-site focus profiles with custom timers and distraction lists.",
      "Calendar-aware meeting detection beyond URL matching.",
      "Exportable focus reports and shareable summaries.",
      "Weekly planning tools that connect goals to completed sessions.",
    ],
  },
  {
    stage: "Later",
    points: [
      "Workspace and team dashboards for shared focus norms.",
      "Cross-device settings sync and mobile companion reminders.",
      "Deeper integrations with task and note tools.",
    ],
  },
];

export default async function RoadmapPage() {
  const cmsRoadmap = await getPublicRoadmap();
  const blocks =
    cmsRoadmap.length > 0
      ? cmsRoadmap.map((entry) => ({
          stage: entry.stage,
          points: Array.isArray(entry.points) ? entry.points : [],
        }))
      : roadmap;

  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Roadmap</h1>
        <p className="mt-2 text-sm text-slate-600">What we are building to help you protect deep work time.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map((block) => (
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
