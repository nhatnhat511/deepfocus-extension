import {
  type HomeSection,
  type HomepageBlock,
  splitPipeText,
} from "@/lib/cms/homepageBlocks";

export type HomepageAction = {
  label: string;
  href: string;
};

export type HomepageRenderBlock = {
  id: string;
  key: string;
};

export type HomepageFeatureCard = HomepageRenderBlock & {
  title: string;
  description: string;
};

export type HomepageListSection = HomepageRenderBlock & {
  title: string;
  items: string[];
};

export type HomepageAudienceItem = {
  role: string;
  note: string;
};

export type HomepageRenderModel = {
  hero: HomepageRenderBlock & {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryAction: HomepageAction;
    secondaryAction: HomepageAction;
    tertiaryAction: HomepageAction;
  };
  heroHighlights: HomepageRenderBlock & {
    items: string[];
  };
  features: HomepageFeatureCard[];
  steps: HomepageRenderBlock & {
    title: string;
    items: string[];
    primaryAction: HomepageAction;
  };
  audience: HomepageRenderBlock & {
    title: string;
    items: HomepageAudienceItem[];
    previewLabel: string;
    previewText: string;
  };
  proofGrid: HomepageListSection;
  cta: HomepageRenderBlock & {
    title: string;
    subtitle: string;
    primaryAction: HomepageAction;
    secondaryAction: HomepageAction;
  };
  flexBlocks: HomepageBlock[];
};

const fallbackFeatures: HomepageFeatureCard[] = [];

const fallbackSteps = [
  "Install DeepFocus Time from the Chrome Web Store.",
  "Pin the extension and set your focus and break durations.",
  "Start a session and keep momentum with reminders and smart controls.",
];

const fallbackAudience: HomepageAudienceItem[] = [
  { role: "Students", note: "Plan study sprints and breaks without breaking concentration." },
  { role: "Remote workers", note: "Protect deep work blocks in busy browser-heavy workflows." },
  { role: "Builders", note: "Run stable coding sessions with predictable timer behavior." },
];

const fallbackProofItems = [
  "Clear, practical feature set focused on daily execution instead of noisy dashboards.",
  "Consistent account state across extension and website for trial and premium management.",
  "Legal pages, support flow, and contact path ready for professional SaaS operations.",
  "Lightweight UX built to reduce friction before, during, and after each focus session.",
];

function parseAudienceItems(items: string[]) {
  return items
    .map((item) => {
      const [role, ...rest] = item.split(":");
      return {
        role: role.trim(),
        note: rest.join(":").trim(),
      };
    })
    .filter((item) => item.role && item.note);
}

function mapBlockId(block: Pick<HomepageBlock, "uid" | "key">) {
  return {
    id: block.uid || block.key,
    key: block.key,
  };
}

export function buildHomepageRenderModelFromBlocks(blocks: HomepageBlock[]): HomepageRenderModel {
  const enabledBlocks = blocks.filter((block) => block.enabled);
  const hero = enabledBlocks.find((block) => block.type === "hero");
  const heroHighlights = enabledBlocks.find((block) => block.type === "hero-highlights");
  const featureBlocks = enabledBlocks.filter((block) => block.type === "feature-card");
  const stepsBlock = enabledBlocks.find((block) => block.type === "steps");
  const audienceBlock = enabledBlocks.find((block) => block.type === "audience");
  const proofBlock = enabledBlocks.find((block) => block.type === "proof-grid");
  const ctaBlock = enabledBlocks.find((block) => block.type === "cta");
  const flexBlocks = enabledBlocks.filter((block) =>
    !["hero", "hero-highlights", "feature-card", "steps", "audience", "proof-grid", "cta"].includes(block.type)
  );

  return {
    hero: {
      ...(hero ? mapBlockId(hero) : { id: "hero", key: "hero" }),
      eyebrow: hero?.eyebrow || "Chrome Extension for Intentional Work",
      title: hero?.title || "Focus deeper in Chrome with a timer built for real workdays.",
      subtitle:
        hero?.subtitle ||
        "DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in one lightweight extension.",
      primaryAction: {
        label: hero?.primaryLabel || "Add to Chrome",
        href: hero?.primaryHref || "https://chromewebstore.google.com/",
      },
      secondaryAction: {
        label: hero?.secondaryLabel || "Compare Plans",
        href: hero?.secondaryHref || "/pricing",
      },
      tertiaryAction: {
        label: "Start Free Trial",
        href: "/account",
      },
    },
    heroHighlights: {
      ...(heroHighlights ? mapBlockId(heroHighlights) : { id: "hero-highlights", key: "hero-highlights" }),
      items: heroHighlights?.items.length ? heroHighlights.items : [],
    },
    features: featureBlocks.length
      ? featureBlocks.map((block) => ({
          ...mapBlockId(block),
          title: block.title || block.key,
          description: block.subtitle || "Update this homepage block from the CMS admin.",
        }))
      : fallbackFeatures,
    steps: {
      ...(stepsBlock ? mapBlockId(stepsBlock) : { id: "steps-primary", key: "steps-primary" }),
      title: stepsBlock?.title || "How it works",
      items: stepsBlock?.items.length ? stepsBlock.items : fallbackSteps,
      primaryAction: {
        label: stepsBlock?.primaryLabel || "View Setup Help",
        href: stepsBlock?.primaryHref || "/support",
      },
    },
    audience: {
      ...(audienceBlock ? mapBlockId(audienceBlock) : { id: "audience-primary", key: "audience-primary" }),
      title: audienceBlock?.title || "Designed for people who work in Chrome",
      items: parseAudienceItems(audienceBlock?.items || []).length
        ? parseAudienceItems(audienceBlock?.items || [])
        : fallbackAudience,
      previewLabel: audienceBlock?.eyebrow || "Product preview",
      previewText:
        audienceBlock?.mediaUrl ||
        "Popup controls for Focus/Break, reminders, keyboard shortcuts, and Advanced Settings are available from a single compact interface.",
    },
    proofGrid: {
      ...(proofBlock ? mapBlockId(proofBlock) : { id: "proof-grid", key: "proof-grid" }),
      title: proofBlock?.title || "Why teams choose DeepFocus Time",
      items: proofBlock?.items.length ? proofBlock.items : fallbackProofItems,
    },
    cta: {
      ...(ctaBlock ? mapBlockId(ctaBlock) : { id: "cta", key: "cta" }),
      title: ctaBlock?.title || "Ready to improve focus consistency?",
      subtitle:
        ctaBlock?.subtitle ||
        "Install the extension, run your first session, and refine your setup with features that match your workflow.",
      primaryAction: {
        label: ctaBlock?.primaryLabel || "Add to Chrome",
        href: ctaBlock?.primaryHref || "https://chromewebstore.google.com/",
      },
      secondaryAction: {
        label: ctaBlock?.secondaryLabel || "Read FAQ",
        href: ctaBlock?.secondaryHref || "/faq",
      },
    },
    flexBlocks,
  };
}

export function buildHomepageRenderModelFromSections(sections: HomeSection[]) {
  const blockLike: HomepageBlock[] = sections.map((section) => ({
    uid: section.id,
    legacyId: section.id,
    key: section.key,
    type:
      section.key === "hero"
        ? "hero"
        : section.key === "hero-highlights"
          ? "hero-highlights"
          : section.key === "cta"
            ? "cta"
            : section.key.startsWith("steps")
              ? "steps"
              : section.key.startsWith("audience")
                ? "audience"
                : section.key.startsWith("proof")
                  ? "proof-grid"
                  : section.key.startsWith("image")
                    ? "image"
                    : section.key.startsWith("video")
                      ? "video"
                      : section.key.startsWith("html")
                        ? "html"
                        : section.key.startsWith("columns-2")
                          ? "columns-2"
                          : section.key.startsWith("columns-3")
                            ? "columns-3"
                            : "feature-card",
    title: section.title || "",
    subtitle: section.subtitle || "",
    eyebrow: section.key === "hero" ? section.image_url || "" : section.key.startsWith("audience") ? section.cta_label || "" : "",
    primaryLabel: section.key === "hero" || section.key === "cta" || section.key.startsWith("steps") ? section.cta_label || "" : "",
    primaryHref: section.key === "hero" || section.key === "cta" || section.key.startsWith("steps") ? section.cta_href || "" : "",
    secondaryLabel: section.key === "cta" ? "Read FAQ" : "",
    secondaryHref: section.key === "cta" ? "/faq" : "",
    mediaUrl: section.key.startsWith("audience") ? section.image_url || "" : "",
    items:
      ["hero-highlights", "proof-grid"].includes(section.key) || section.key.startsWith("steps") || section.key.startsWith("audience")
        ? splitPipeText(section.subtitle)
        : [],
    enabled: section.is_enabled ?? true,
    sortOrder: section.sort_order ?? 0,
  }));

  return buildHomepageRenderModelFromBlocks(blockLike.sort((a, b) => a.sortOrder - b.sortOrder));
}
