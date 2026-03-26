export type HomeSection = {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  is_enabled: boolean | null;
  sort_order: number | null;
};

export type HomepageBlockType =
  | "hero"
  | "hero-highlights"
  | "feature-card"
  | "steps"
  | "audience"
  | "proof-grid"
  | "cta"
  | "image"
  | "video"
  | "html"
  | "columns-2"
  | "columns-3";

export type HomepageBlock = {
  uid: string;
  legacyId: string;
  key: string;
  type: HomepageBlockType;
  title: string;
  subtitle: string;
  eyebrow: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  mediaUrl: string;
  items: string[];
  enabled: boolean;
  sortOrder: number;
};

export const homepagePalette: Array<{
  type: HomepageBlockType;
  label: string;
  description: string;
  seed: Partial<HomepageBlock>;
}> = [
  {
    type: "hero",
    label: "Hero",
    description: "Main headline, supporting copy, and primary CTA.",
    seed: {
      key: "hero",
      title: "Focus deeper in Chrome with a timer built for real workdays.",
      subtitle:
        "DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in one lightweight extension.",
      primaryLabel: "Add to Chrome",
      primaryHref: "https://chromewebstore.google.com/detail/deepfocus-time-smart-work/hocagcogehhegknmljfffpgkegdkbfko",
    },
  },
  {
    type: "hero-highlights",
    label: "Hero Highlights",
    description: "Three compact proof points below the hero CTA row.",
    seed: {
      key: "hero-highlights",
      items: [
        "No card needed to start trial",
        "Built for focused browser workflows",
        "Secure account auth with Supabase",
      ],
    },
  },
  {
    type: "feature-card",
    label: "Feature Card",
    description: "A card inside the three-column feature grid.",
    seed: { title: "Feature title", subtitle: "Explain the value clearly and directly." },
  },
  {
    type: "steps",
    label: "How It Works",
    description: "Ordered step list for the left detail column.",
    seed: {
      key: "steps-primary",
      title: "How it works",
      items: [
        "Install DeepFocus Time from the Chrome Web Store.",
        "Pin the extension and set your focus and break durations.",
        "Start a session and keep momentum with reminders and smart controls.",
      ],
      primaryLabel: "View Setup Help",
      primaryHref: "/support",
    },
  },
  {
    type: "audience",
    label: "Audience",
    description: "Right column audience panel with product preview note.",
    seed: {
      key: "audience-primary",
      title: "Designed for people who work in Chrome",
      items: [
        "Students: Plan study sprints and breaks without breaking concentration.",
        "Remote workers: Protect deep work blocks in busy browser-heavy workflows.",
        "Builders: Run stable coding sessions with predictable timer behavior.",
      ],
      eyebrow: "Product preview",
      mediaUrl:
        "Popup controls for Focus/Break, reminders, keyboard shortcuts, and Advanced Settings are available from a single compact interface.",
    },
  },
  {
    type: "proof-grid",
    label: "Proof Grid",
    description: "Four proof bullets in the Why teams choose section.",
    seed: {
      key: "proof-grid",
      title: "Why teams choose DeepFocus Time",
      items: [
        "Clear, practical feature set focused on daily execution instead of noisy dashboards.",
        "Consistent account state across extension and website for trial and premium management.",
        "Legal pages, support flow, and contact path ready for professional SaaS operations.",
        "Lightweight UX built to reduce friction before, during, and after each focus session.",
      ],
    },
  },
  {
    type: "cta",
    label: "CTA Banner",
    description: "Closing call-to-action area.",
    seed: {
      key: "cta",
      title: "Ready to improve focus consistency?",
      subtitle:
        "Install the extension, run your first session, and refine your setup with features that match your workflow.",
      primaryLabel: "Add to Chrome",
      primaryHref: "https://chromewebstore.google.com/detail/deepfocus-time-smart-work/hocagcogehhegknmljfffpgkegdkbfko",
      secondaryLabel: "Read FAQ",
      secondaryHref: "/faq",
    },
  },
  {
    type: "image",
    label: "Image Block",
    description: "Standalone visual module for future homepage expansion.",
    seed: { title: "Image highlight", subtitle: "Visual context block." },
  },
  {
    type: "video",
    label: "Video Embed",
    description: "Standalone video or demo module.",
    seed: { title: "Product walkthrough", subtitle: "Paste a video URL.", mediaUrl: "https://www.youtube.com/watch?v=" },
  },
  {
    type: "html",
    label: "HTML Embed",
    description: "Advanced custom embed block.",
    seed: { title: "HTML embed", subtitle: "<div>Custom HTML or widget</div>" },
  },
  {
    type: "columns-2",
    label: "2 Columns",
    description: "Flexible two-column planning block.",
    seed: { title: "Two-column section", items: ["Left column content", "Right column content"] },
  },
  {
    type: "columns-3",
    label: "3 Columns",
    description: "Flexible three-column planning block.",
    seed: { title: "Three-column section", items: ["Column one", "Column two", "Column three"] },
  },
];

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function splitPipeText(value: string | null | undefined) {
  return (value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinPipeText(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean).join("|");
}

export function createHomepageBlock(type: HomepageBlockType, seed: Partial<HomepageBlock> = {}): HomepageBlock {
  const titleSeed = seed.title || seed.key || type;
  return {
    uid: seed.uid || uid(),
    legacyId: seed.legacyId || "",
    key: seed.key || `${type}-${slugify(titleSeed)}`,
    type,
    title: seed.title || "",
    subtitle: seed.subtitle || "",
    eyebrow: seed.eyebrow || "",
    primaryLabel: seed.primaryLabel || "",
    primaryHref: seed.primaryHref || "",
    secondaryLabel: seed.secondaryLabel || "",
    secondaryHref: seed.secondaryHref || "",
    mediaUrl: seed.mediaUrl || "",
    items: seed.items ? [...seed.items] : [],
    enabled: seed.enabled ?? true,
    sortOrder: seed.sortOrder ?? 0,
  };
}

export function defaultHomepageBlocks() {
  const defaults = homepagePalette
    .filter((item) =>
      ["hero", "hero-highlights", "feature-card", "steps", "audience", "proof-grid", "cta"].includes(item.type)
    )
    .flatMap((item) => {
      if (item.type === "feature-card") {
        return [
          createHomepageBlock("feature-card", {
            key: "feature-focus-timer",
            title: "Focus timer that stays out of your way",
            subtitle: "Start, pause, resume, and reset sessions quickly from the popup while keeping a clean workspace.",
          }),
          createHomepageBlock("feature-card", {
            key: "feature-sync",
            title: "Reliable session sync across tabs",
            subtitle: "Your active session state stays consistent while you move between tasks and browser tabs.",
          }),
          createHomepageBlock("feature-card", {
            key: "feature-advanced-controls",
            title: "Advanced controls for serious focus",
            subtitle: "Use premium settings such as distraction mute, idle auto-pause, and meeting-aware automation.",
          }),
        ];
      }

      return [createHomepageBlock(item.type, item.seed)];
    });

  return defaults.map((block, index) => ({ ...block, sortOrder: index }));
}

export function inferHomepageBlockType(key: string): HomepageBlockType {
  if (key === "hero") return "hero";
  if (key === "hero-highlights") return "hero-highlights";
  if (key === "cta") return "cta";
  if (key.startsWith("steps")) return "steps";
  if (key.startsWith("audience")) return "audience";
  if (key.startsWith("proof")) return "proof-grid";
  if (key.startsWith("image")) return "image";
  if (key.startsWith("video")) return "video";
  if (key.startsWith("html")) return "html";
  if (key.startsWith("columns-2")) return "columns-2";
  if (key.startsWith("columns-3")) return "columns-3";
  return "feature-card";
}

export function homepageBlocksFromLegacySections(sections: HomeSection[]) {
  if (!sections.length) {
    return defaultHomepageBlocks();
  }

  const blocks = sections.map((section) =>
    createHomepageBlock(inferHomepageBlockType(section.key), {
      legacyId: section.id,
      key: section.key,
      title: section.title || "",
      subtitle:
        inferHomepageBlockType(section.key) === "feature-card" ||
        inferHomepageBlockType(section.key) === "hero" ||
        inferHomepageBlockType(section.key) === "cta"
          ? section.subtitle || ""
          : "",
      items:
        [
          "hero-highlights",
          "steps",
          "audience",
          "proof-grid",
          "columns-2",
          "columns-3",
        ].includes(inferHomepageBlockType(section.key))
          ? splitPipeText(section.subtitle)
          : [],
      primaryLabel:
        inferHomepageBlockType(section.key) === "hero" || inferHomepageBlockType(section.key) === "cta" || inferHomepageBlockType(section.key) === "steps"
          ? section.cta_label || ""
          : "",
      primaryHref:
        inferHomepageBlockType(section.key) === "hero" || inferHomepageBlockType(section.key) === "cta" || inferHomepageBlockType(section.key) === "steps"
          ? section.cta_href || ""
          : "",
      secondaryLabel: inferHomepageBlockType(section.key) === "cta" ? "Read FAQ" : "",
      secondaryHref: inferHomepageBlockType(section.key) === "cta" ? "/faq" : "",
      eyebrow: inferHomepageBlockType(section.key) === "audience" ? section.cta_label || "" : "",
      mediaUrl:
        inferHomepageBlockType(section.key) === "audience" || inferHomepageBlockType(section.key) === "hero" || inferHomepageBlockType(section.key) === "image" || inferHomepageBlockType(section.key) === "video"
          ? section.image_url || ""
          : "",
      enabled: section.is_enabled ?? true,
      sortOrder: section.sort_order ?? 0,
    })
  );

  const sorted = blocks.sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.length ? sorted : defaultHomepageBlocks();
}

export function legacySectionsFromHomepageBlocks(blocks: HomepageBlock[]) {
  return blocks
    .filter((block) => block.enabled)
    .map((block, index) => {
      let subtitle = block.subtitle.trim() || null;

      if (["hero-highlights", "steps", "audience", "proof-grid", "columns-2", "columns-3"].includes(block.type)) {
        subtitle = joinPipeText(block.items) || null;
      }

      return {
        id: block.legacyId || undefined,
        key: block.key.trim(),
        title: block.title.trim() || null,
        subtitle,
        cta_label:
          block.type === "hero" || block.type === "cta" || block.type === "steps"
            ? block.primaryLabel.trim() || null
            : block.type === "audience"
              ? block.eyebrow.trim() || null
              : null,
        cta_href:
          block.type === "hero" || block.type === "cta" || block.type === "steps"
            ? block.primaryHref.trim() || null
            : null,
        image_url:
          block.type === "hero" || block.type === "audience" || block.type === "image" || block.type === "video"
            ? block.mediaUrl.trim() || null
            : null,
        is_enabled: true,
        sort_order: index,
      };
    });
}
