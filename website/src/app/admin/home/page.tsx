"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type HomeSection = {
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

type BlockType = "hero" | "feature" | "steps" | "audience" | "cta" | "image" | "video" | "html" | "columns-2" | "columns-3";

type BuilderSection = {
  id: string;
  key: string;
  type: BlockType;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  image_url: string;
  is_enabled: boolean;
  sort_order: number;
};

const palette: Array<{ type: BlockType; label: string; description: string; seed: Partial<BuilderSection> }> = [
  {
    type: "hero",
    label: "Hero",
    description: "Headline, supporting copy, primary CTA.",
    seed: {
      key: "hero",
      title: "Focus deeper in Chrome with a timer built for real workdays.",
      subtitle:
        "DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in one lightweight extension.",
      cta_label: "Add to Chrome",
      cta_href: "https://chromewebstore.google.com/",
    },
  },
  {
    type: "feature",
    label: "Feature Card",
    description: "A concise title and description block.",
    seed: { title: "Feature title", subtitle: "Explain the value clearly and directly." },
  },
  {
    type: "steps",
    label: "Steps",
    description: "Use | to separate ordered steps.",
    seed: { title: "How it works", subtitle: "Install extension|Configure durations|Start a session" },
  },
  {
    type: "audience",
    label: "Audience",
    description: "Use | to separate audience lines.",
    seed: { title: "Designed for people who work in Chrome", subtitle: "Students: study sprints|Remote workers: deep work|Builders: stable coding sessions" },
  },
  {
    type: "cta",
    label: "CTA Banner",
    description: "Bottom call-to-action section.",
    seed: {
      key: "cta",
      title: "Ready to improve focus consistency?",
      subtitle: "Install the extension, run your first session, and refine your setup with features that match your workflow.",
      cta_label: "Add to Chrome",
      cta_href: "https://chromewebstore.google.com/",
    },
  },
  {
    type: "image",
    label: "Image Block",
    description: "Visual placeholder block with media URL.",
    seed: { title: "Image highlight", subtitle: "Add visual context.", image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085" },
  },
  {
    type: "video",
    label: "Video Embed",
    description: "Demo/video placeholder block.",
    seed: { title: "Product walkthrough", subtitle: "Paste a demo URL.", image_url: "https://www.youtube.com/watch?v=" },
  },
  {
    type: "html",
    label: "HTML Embed",
    description: "Advanced embed placeholder.",
    seed: { title: "HTML embed", subtitle: "<div>Custom HTML or widget</div>" },
  },
  {
    type: "columns-2",
    label: "2 Columns",
    description: "Two-column planning block.",
    seed: { title: "Two-column section", subtitle: "Left column content|Right column content" },
  },
  {
    type: "columns-3",
    label: "3 Columns",
    description: "Three-column planning block.",
    seed: { title: "Three-column section", subtitle: "Column one|Column two|Column three" },
  },
];

function defaultHomepageSections(): BuilderSection[] {
  return [
    makeBlock("hero", {
      key: "hero",
      title: "Focus deeper in Chrome with a timer built for real workdays.",
      subtitle:
        "DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in one lightweight extension.",
      cta_label: "Add to Chrome",
      cta_href: "https://chromewebstore.google.com/",
    }),
    makeBlock("feature", {
      key: "feature-focus-timer",
      title: "Focus timer that stays out of your way",
      subtitle: "Start, pause, resume, and reset sessions quickly from the popup while keeping a clean workspace.",
    }),
    makeBlock("feature", {
      key: "feature-sync",
      title: "Reliable session sync across tabs",
      subtitle: "Your active session state stays consistent while you move between tasks and browser tabs.",
    }),
    makeBlock("feature", {
      key: "feature-advanced-controls",
      title: "Advanced controls for serious focus",
      subtitle: "Use premium settings such as distraction mute, idle auto-pause, and meeting-aware automation.",
    }),
    makeBlock("steps", {
      key: "steps-primary",
      title: "How it works",
      subtitle:
        "Install DeepFocus Time from the Chrome Web Store.|Pin the extension and set your focus and break durations.|Start a session and keep momentum with reminders and smart controls.",
    }),
    makeBlock("audience", {
      key: "audience-primary",
      title: "Designed for people who work in Chrome",
      subtitle:
        "Students: Plan study sprints and breaks without breaking concentration.|Remote workers: Protect deep work blocks in busy browser-heavy workflows.|Builders: Run stable coding sessions with predictable timer behavior.",
    }),
    makeBlock("cta", {
      key: "cta",
      title: "Ready to improve focus consistency?",
      subtitle: "Install the extension, run your first session, and refine your setup with features that match your workflow.",
      cta_label: "Add to Chrome",
      cta_href: "https://chromewebstore.google.com/",
    }),
  ].map((section, index) => ({ ...section, sort_order: index }));
}

function inferType(key: string): BlockType {
  if (key === "hero") return "hero";
  if (key === "cta") return "cta";
  if (key.startsWith("steps")) return "steps";
  if (key.startsWith("audience")) return "audience";
  if (key.startsWith("image")) return "image";
  if (key.startsWith("video")) return "video";
  if (key.startsWith("html")) return "html";
  if (key.startsWith("columns-2")) return "columns-2";
  if (key.startsWith("columns-3")) return "columns-3";
  return "feature";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32);
}

function splitPipes(value: string) {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function toBuilder(section: HomeSection): BuilderSection {
  return {
    id: section.id,
    key: section.key,
    type: inferType(section.key),
    title: section.title || "",
    subtitle: section.subtitle || "",
    cta_label: section.cta_label || "",
    cta_href: section.cta_href || "",
    image_url: section.image_url || "",
    is_enabled: section.is_enabled ?? true,
    sort_order: section.sort_order ?? 0,
  };
}

function makeBlock(type: BlockType, seed: Partial<BuilderSection>): BuilderSection {
  const token = Date.now().toString(36);
  return {
    id: "",
    key: seed.key || `${type}-${slugify(seed.title || token)}`,
    type,
    title: seed.title || "",
    subtitle: seed.subtitle || "",
    cta_label: seed.cta_label || "",
    cta_href: seed.cta_href || "",
    image_url: seed.image_url || "",
    is_enabled: true,
    sort_order: 0,
  };
}

function BlockPreview({ section }: { section: BuilderSection }) {
  const lines = splitPipes(section.subtitle);

  if (section.type === "hero") {
    return (
      <div className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-8">
        <p className="mb-4 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Chrome Extension for Intentional Work
        </p>
        <h3 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900">{section.title || "Hero headline"}</h3>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{section.subtitle || "Supporting hero copy."}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">{section.cta_label || "Primary CTA"}</span>
          <span className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Secondary CTA</span>
        </div>
      </div>
    );
  }

  if (section.type === "steps") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-2xl font-semibold text-slate-900">{section.title || "How it works"}</h3>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          {(lines.length ? lines : ["Step one", "Step two", "Step three"]).map((line, index) => (
            <li key={line} className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{index + 1}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (section.type === "audience") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-2xl font-semibold text-slate-900">{section.title || "Audience block"}</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {(lines.length ? lines : ["Audience: use case"]).map((line) => (
            <p key={line} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{line}</p>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "cta") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-2xl font-semibold text-slate-900">{section.title || "CTA title"}</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">{section.subtitle || "Conversion copy."}</p>
        <div className="mt-5">
          <span className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">{section.cta_label || "Call to action"}</span>
        </div>
      </div>
    );
  }

  if (section.type === "image" || section.type === "video") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 grid min-h-40 place-items-center rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-slate-50 text-sm font-semibold text-sky-700">
          {section.type === "image" ? "Image preview" : "Video preview"}
        </div>
        <h3 className="text-xl font-semibold text-slate-900">{section.title || "Media block"}</h3>
        <p className="mt-2 text-sm text-slate-600">{section.subtitle || "Media description."}</p>
      </div>
    );
  }

  if (section.type === "html") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-semibold text-slate-900">{section.title || "HTML block"}</h3>
        <code className="mt-4 block rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {section.subtitle || "<div>Custom HTML</div>"}
        </code>
      </div>
    );
  }

  if (section.type === "columns-2" || section.type === "columns-3") {
    const columns = lines.length ? lines : ["Column A", "Column B", ...(section.type === "columns-3" ? ["Column C"] : [])];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-semibold text-slate-900">{section.title || "Columns block"}</h3>
        <div className={`mt-4 grid gap-3 ${section.type === "columns-3" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {columns.map((column) => (
            <div key={column} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {column}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900">{section.title || "Feature title"}</h3>
      <p className="mt-2 text-sm text-slate-600">{section.subtitle || "Feature description."}</p>
    </div>
  );
}

export default function AdminHome() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [sections, setSections] = useState<BuilderSection[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [dragKey, setDragKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadSections() {
      setLoading(true);
      setError("");
      try {
        const { data, error: fetchError } = await supabase.from("cms_home_sections").select("*").order("sort_order", { ascending: true });
        if (fetchError) throw fetchError;
        const mapped = ((data as HomeSection[]) || []).map(toBuilder);
        const hydrated = mapped.length ? mapped : defaultHomepageSections();
        setSections(hydrated);
        setSelectedKey(hydrated[0]?.key || "");
        setRemovedIds([]);
        if (!mapped.length) {
          setStatus("Loaded the current homepage structure as the starting point.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load homepage sections.");
      } finally {
        setLoading(false);
      }
    }

    void loadSections();
  }, [supabase]);

  const selectedBlock = sections.find((section) => section.key === selectedKey) || null;

  function addBlock(type: BlockType, seed: Partial<BuilderSection>) {
    const block = makeBlock(type, seed);
    setSections((prev) => [...prev, { ...block, sort_order: prev.length }]);
    setSelectedKey(block.key);
    setStatus(`Added ${type} block.`);
  }

  function updateBlock(key: string, patch: Partial<BuilderSection>) {
    setSections((prev) => prev.map((section, index) => section.key === key ? { ...section, ...patch, sort_order: index } : section));
  }

  function moveBlock(fromKey: string, toKey: string) {
    if (!fromKey || fromKey === toKey) return;
    setSections((prev) => {
      const fromIndex = prev.findIndex((item) => item.key === fromKey);
      const toIndex = prev.findIndex((item) => item.key === toKey);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((item, index) => ({ ...item, sort_order: index }));
    });
  }

  function duplicateBlock(key: string) {
    const source = sections.find((section) => section.key === key);
    if (!source) return;
    const copy = { ...source, id: "", key: `${source.type}-${slugify(source.title || source.key)}-${Date.now().toString(36)}` };
    setSections((prev) => prev.flatMap((section) => (section.key === key ? [section, copy] : [section])).map((section, index) => ({ ...section, sort_order: index })));
    setSelectedKey(copy.key);
  }

  function removeBlock(key: string) {
    const target = sections.find((section) => section.key === key);
    if (!target) return;
    if (target.id) setRemovedIds((prev) => [...prev, target.id]);
    const next = sections.filter((section) => section.key !== key).map((section, index) => ({ ...section, sort_order: index }));
    setSections(next);
    setSelectedKey(next[0]?.key || "");
  }

  async function saveAll() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase.from("cms_home_sections").delete().in("id", removedIds);
        if (deleteError) throw deleteError;
      }

      for (const [index, section] of sections.entries()) {
        const payload = {
          key: section.key.trim(),
          title: section.title.trim() || null,
          subtitle: section.subtitle.trim() || null,
          cta_label: section.cta_label.trim() || null,
          cta_href: section.cta_href.trim() || null,
          image_url: section.image_url.trim() || null,
          is_enabled: !!section.is_enabled,
          sort_order: index,
        };

        if (!payload.key) throw new Error("Each block needs a valid key.");

        if (section.id) {
          const { error: updateError } = await supabase.from("cms_home_sections").update(payload).eq("id", section.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase.from("cms_home_sections").insert(payload);
          if (insertError) throw insertError;
        }
      }

      setStatus("Homepage layout saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save homepage layout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="wp-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Homepage Visual Builder</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Drag blocks to reorder the page, click a block to edit it, and work against a visual version of the current homepage.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const next = defaultHomepageSections();
                setSections(next);
                setSelectedKey(next[0]?.key || "");
                setRemovedIds([]);
                setStatus("Loaded the current homepage layout into the builder.");
              }}
              className="wp-btn"
            >
              Load Current Homepage
            </button>
            <button type="button" onClick={saveAll} disabled={saving} className="wp-btn wp-btn-primary">
              {saving ? "Saving..." : "Save Homepage"}
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {status ? <p className="mt-3 text-sm text-emerald-600">{status}</p> : null}
      </header>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="wp-card p-5">
          <h2 className="wp-panel-title text-base text-slate-900">Block Library</h2>
          <p className="mt-1 text-xs text-slate-500">Add professional homepage blocks and planning modules.</p>
          <div className="mt-4 grid gap-3">
            {palette.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addBlock(item.type, item.seed)}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg"
              >
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{item.description}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="wp-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="wp-panel-title text-base text-slate-900">Live Canvas</h2>
                <p className="mt-1 text-xs text-slate-500">Direct visual editing surface for the current homepage structure.</p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{sections.length} blocks</span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600">Loading homepage blocks...</p>
            ) : sections.length ? (
              <div className="space-y-4">
                {sections.map((section) => (
                  <article
                    key={section.key}
                    draggable
                    onDragStart={() => setDragKey(section.key)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveBlock(dragKey, section.key)}
                    onClick={() => setSelectedKey(section.key)}
                    className={`rounded-[22px] border p-4 transition ${selectedKey === section.key ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"} ${section.is_enabled ? "bg-white" : "bg-slate-50 opacity-55"}`}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="cursor-grab tracking-[0.25em]">::</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 uppercase text-slate-700">{section.type}</span>
                        <span>{section.key}</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={(event) => { event.stopPropagation(); duplicateBlock(section.key); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Duplicate</button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); removeBlock(section.key); }} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Remove</button>
                      </div>
                    </div>
                    <BlockPreview section={section} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">No blocks yet</h3>
                  <p className="mt-2 text-sm">Start with a Hero block, then add cards, steps, audience, and CTA modules.</p>
                </div>
              </div>
            )}
          </section>

          <aside className="wp-card p-5">
            <h2 className="wp-panel-title text-base text-slate-900">Inspector</h2>
            <p className="mt-1 text-xs text-slate-500">Edit the selected block with immediate preview feedback.</p>
            {selectedBlock ? (
              <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Block key
                <input className="wp-field" value={selectedBlock.key} onChange={(event) => updateBlock(selectedBlock.key, { key: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Block type
                <select
                  className="wp-select"
                  value={selectedBlock.type}
                  onChange={(event) => updateBlock(selectedBlock.key, { type: event.target.value as BlockType, key: `${event.target.value}-${slugify(selectedBlock.title || selectedBlock.key)}` })}
                >
                  {palette.map((item) => (
                    <option key={item.type} value={item.type}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Title
                <input className="wp-field" value={selectedBlock.title} onChange={(event) => updateBlock(selectedBlock.key, { title: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Content / copy
                <textarea
                  className="wp-textarea"
                  rows={selectedBlock.type === "html" ? 8 : 5}
                  value={selectedBlock.subtitle}
                  onChange={(event) => updateBlock(selectedBlock.key, { subtitle: event.target.value })}
                  placeholder={selectedBlock.type === "steps" || selectedBlock.type === "audience" || selectedBlock.type.startsWith("columns") ? "Use | to separate items" : "Add descriptive copy"}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                CTA label
                <input className="wp-field" value={selectedBlock.cta_label} onChange={(event) => updateBlock(selectedBlock.key, { cta_label: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                CTA / link URL
                <input className="wp-field" value={selectedBlock.cta_href} onChange={(event) => updateBlock(selectedBlock.key, { cta_href: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Media URL
                <input className="wp-field" value={selectedBlock.image_url} onChange={(event) => updateBlock(selectedBlock.key, { image_url: event.target.value })} placeholder="Image, video, or embed URL" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Visibility
                <select className="wp-select" value={selectedBlock.is_enabled ? "enabled" : "hidden"} onChange={(event) => updateBlock(selectedBlock.key, { is_enabled: event.target.value === "enabled" })}>
                  <option value="enabled">Enabled</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                <strong className="block text-slate-900">Builder note</strong>
                Hero, feature-style cards, and CTA blocks map most directly to the current homepage rendering. Advanced blocks give you a more professional visual planning workflow inside admin without changing the public framework.
              </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Select a block on the canvas to edit it.
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
