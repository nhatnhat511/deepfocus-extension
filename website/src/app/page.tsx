import type { Metadata } from "next";
import { HomepageRenderer } from "@/components/homepage/HomepageRenderer";
import { getPublicHomeSections } from "@/lib/cms/publicContent.server";
import { buildHomepageRenderModelFromSections } from "@/lib/cms/homepageRenderModel";

export const metadata: Metadata = {
  title: {
    absolute: "DeepFocus Time | Chrome Focus Timer Extension",
  },
  description:
    "DeepFocus Time is a Chrome focus timer extension for deep work sessions, smart breaks, and productivity controls.",
};

export default async function Home() {
  const cmsSections = await getPublicHomeSections();
  const model = buildHomepageRenderModelFromSections(cmsSections);

  return <HomepageRenderer model={model} />;
}

// redeploy trigger

// deploy-check

// deploy-reset
