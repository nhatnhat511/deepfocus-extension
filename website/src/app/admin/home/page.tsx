"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  type HomeSection,
  type HomepageBlock,
  type HomepageBlockType,
  createHomepageBlock,
  defaultHomepageBlocks,
  homepageBlocksFromLegacySections,
  homepagePalette,
  legacySectionsFromHomepageBlocks,
  slugify,
  splitPipeText,
} from "@/lib/cms/homepageBlocks";

type HomepageDocumentRow = {
  id: string;
  slug: string;
  title: string;
  blocks: HomepageBlock[] | null;
};

const DOCUMENT_SLUG = "homepage";

function renderSelectableClass(isSelected: boolean, isEnabled: boolean) {
  const stateClass = isSelected ? "ring-2 ring-sky-200 border-sky-400" : "border-slate-200";
  const enabledClass = isEnabled ? "bg-white" : "bg-slate-50 opacity-60";
  return `cursor-pointer rounded-2xl border transition ${stateClass} ${enabledClass}`;
}

function blockLabel(type: HomepageBlockType) {
  return homepagePalette.find((item) => item.type === type)?.label || type;
}

function CanvasActionBar({
  uid,
  onDuplicate,
  onRemove,
}: {
  uid: string;
  onDuplicate: (uid: string) => void;
  onRemove: (uid: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDuplicate(uid);
        }}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(uid);
        }}
        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
      >
        Remove
      </button>
    </div>
  );
}

function CanvasBlockShell({
  block,
  children,
  isSelected,
  onSelect,
  onDuplicate,
  onRemove,
  onDragStart,
  onDrop,
}: {
  block: HomepageBlock;
  children: ReactNode;
  isSelected: boolean;
  onSelect: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onRemove: (uid: string) => void;
  onDragStart: (uid: string) => void;
  onDrop: (uid: string) => void;
}) {
  return (
    <article
      draggable
      onDragStart={() => onDragStart(block.uid)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(block.uid)}
      onClick={() => onSelect(block.uid)}
      className={renderSelectableClass(isSelected, block.enabled)}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span className="cursor-grab">::</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 tracking-normal text-slate-700">{blockLabel(block.type)}</span>
          <span className="tracking-normal">{block.key}</span>
        </div>
        <CanvasActionBar uid={block.uid} onDuplicate={onDuplicate} onRemove={onRemove} />
      </div>
      {children}
    </article>
  );
}

function GenericBlockPreview({ block }: { block: HomepageBlock }) {
  if (block.type === "image" || block.type === "video") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 to-slate-50 text-sm font-semibold text-sky-700">
          {block.type === "image" ? "Image preview" : "Video preview"}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900">{block.title || "Media block"}</h3>
        <p className="mt-2 text-sm text-slate-600">{block.subtitle || "Standalone media module."}</p>
      </div>
    );
  }

  if (block.type === "html") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-semibold text-slate-900">{block.title || "HTML embed"}</h3>
        <code className="mt-4 block rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {block.subtitle || "<div>Custom HTML</div>"}
        </code>
      </div>
    );
  }

  if (block.type === "columns-2" || block.type === "columns-3") {
    const columns = block.items.length ? block.items : ["Column one", "Column two"];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-semibold text-slate-900">{block.title || "Columns block"}</h3>
        <div className={`mt-4 grid gap-3 ${block.type === "columns-3" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {columns.map((column, index) => (
            <div key={`${block.uid}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {column}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900">{block.title || "Standalone block"}</h3>
      <p className="mt-2 text-sm text-slate-600">{block.subtitle || "Flexible homepage module."}</p>
    </div>
  );
}

function HomepageCanvas({
  blocks,
  selectedUid,
  onSelect,
  onDuplicate,
  onRemove,
  onDragStart,
  onDrop,
}: {
  blocks: HomepageBlock[];
  selectedUid: string;
  onSelect: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onRemove: (uid: string) => void;
  onDragStart: (uid: string) => void;
  onDrop: (uid: string) => void;
}) {
  const enabledBlocks = blocks.filter((block) => block.enabled);
  const hero = enabledBlocks.find((block) => block.type === "hero") || null;
  const heroHighlights = enabledBlocks.find((block) => block.type === "hero-highlights") || null;
  const featureCards = enabledBlocks.filter((block) => block.type === "feature-card");
  const steps = enabledBlocks.find((block) => block.type === "steps") || null;
  const audience = enabledBlocks.find((block) => block.type === "audience") || null;
  const proofGrid = enabledBlocks.find((block) => block.type === "proof-grid") || null;
  const cta = enabledBlocks.find((block) => block.type === "cta") || null;
  const flexBlocks = enabledBlocks.filter(
    (block) => !["hero", "hero-highlights", "feature-card", "steps", "audience", "proof-grid", "cta"].includes(block.type)
  );

  return (
    <div className="space-y-6">
      {hero ? (
        <CanvasBlockShell
          block={hero}
          isSelected={selectedUid === hero.uid}
          onSelect={onSelect}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onDragStart={onDragStart}
          onDrop={onDrop}
        >
          <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
            <p className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {hero.eyebrow || "Chrome Extension for Intentional Work"}
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {hero.title || "Focus deeper in Chrome with a timer built for real workdays."}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              {hero.subtitle ||
                "DeepFocus Time combines session timing, mindful breaks, account sync, and advanced productivity settings in one lightweight extension."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                {hero.primaryLabel || "Add to Chrome"}
              </span>
              <span className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">
                {hero.secondaryLabel || "Compare Plans"}
              </span>
              <span className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">
                Start Free Trial
              </span>
            </div>
            {heroHighlights ? (
              <div
                className={`mt-6 ${renderSelectableClass(selectedUid === heroHighlights.uid, heroHighlights.enabled)} border-0 p-0 shadow-none`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(heroHighlights.uid);
                }}
                draggable
                onDragStart={() => onDragStart(heroHighlights.uid)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(heroHighlights.uid)}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <span className="cursor-grab">::</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 tracking-normal text-slate-700">{blockLabel(heroHighlights.type)}</span>
                    <span className="tracking-normal">{heroHighlights.key}</span>
                  </div>
                  <CanvasActionBar uid={heroHighlights.uid} onDuplicate={onDuplicate} onRemove={onRemove} />
                </div>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  {(heroHighlights.items.length
                    ? heroHighlights.items
                    : [
                        "No card needed to start trial",
                        "Built for focused browser workflows",
                        "Secure account auth with Supabase",
                      ]).map((item, index) => (
                    <p key={`${heroHighlights.uid}-${index}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </CanvasBlockShell>
      ) : null}

      {featureCards.length ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((block) => (
            <CanvasBlockShell
              key={block.uid}
              block={block}
              isSelected={selectedUid === block.uid}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onDragStart={onDragStart}
              onDrop={onDrop}
            >
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">{block.title || "Feature title"}</h2>
                <p className="mt-2 text-sm text-slate-600">{block.subtitle || "Feature description."}</p>
              </article>
            </CanvasBlockShell>
          ))}
        </section>
      ) : null}

      {steps || audience ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {steps ? (
            <CanvasBlockShell
              block={steps}
              isSelected={selectedUid === steps.uid}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onDragStart={onDragStart}
              onDrop={onDrop}
            >
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">{steps.title || "How it works"}</h2>
                <ol className="mt-4 space-y-3 text-sm text-slate-700">
                  {(steps.items.length ? steps.items : splitPipeText(steps.subtitle)).map((item, index) => (
                    <li key={`${steps.uid}-${index}`} className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
                  {steps.primaryLabel || "View Setup Help"}
                </div>
              </article>
            </CanvasBlockShell>
          ) : null}

          {audience ? (
            <CanvasBlockShell
              block={audience}
              isSelected={selectedUid === audience.uid}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onDragStart={onDragStart}
              onDrop={onDrop}
            >
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">{audience.title || "Designed for people who work in Chrome"}</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  {(audience.items.length ? audience.items : splitPipeText(audience.subtitle)).map((item, index) => {
                    const [label, ...rest] = item.split(":");
                    return (
                      <p key={`${audience.uid}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {rest.length ? (
                          <>
                            <span className="font-semibold text-slate-900">{label}:</span> {rest.join(":").trim()}
                          </>
                        ) : (
                          item
                        )}
                      </p>
                    );
                  })}
                </div>
                <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {audience.eyebrow || "Product preview"}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {audience.mediaUrl ||
                      "Popup controls for Focus/Break, reminders, keyboard shortcuts, and Advanced Settings are available from a single compact interface."}
                  </p>
                </div>
              </article>
            </CanvasBlockShell>
          ) : null}
        </section>
      ) : null}

      {proofGrid ? (
        <CanvasBlockShell
          block={proofGrid}
          isSelected={selectedUid === proofGrid.uid}
          onSelect={onSelect}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onDragStart={onDragStart}
          onDrop={onDrop}
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">{proofGrid.title || "Why teams choose DeepFocus Time"}</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              {(proofGrid.items.length ? proofGrid.items : splitPipeText(proofGrid.subtitle)).map((item, index) => (
                <p key={`${proofGrid.uid}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {item}
                </p>
              ))}
            </div>
          </section>
        </CanvasBlockShell>
      ) : null}

      {cta ? (
        <CanvasBlockShell
          block={cta}
          isSelected={selectedUid === cta.uid}
          onSelect={onSelect}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onDragStart={onDragStart}
          onDrop={onDrop}
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">{cta.title || "Ready to improve focus consistency?"}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {cta.subtitle ||
                "Install the extension, run your first session, and refine your setup with features that match your workflow."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                {cta.primaryLabel || "Add to Chrome"}
              </span>
              <span className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">
                {cta.secondaryLabel || "Read FAQ"}
              </span>
            </div>
          </section>
        </CanvasBlockShell>
      ) : null}

      {flexBlocks.length ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Flexible blocks below are stored in the new block schema and stay inside admin planning until you map them to live rendering.
          </div>
          {flexBlocks.map((block) => (
            <CanvasBlockShell
              key={block.uid}
              block={block}
              isSelected={selectedUid === block.uid}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onDragStart={onDragStart}
              onDrop={onDrop}
            >
              <GenericBlockPreview block={block} />
            </CanvasBlockShell>
          ))}
        </section>
      ) : null}

      {!enabledBlocks.length ? (
        <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">No blocks yet</h3>
            <p className="mt-2 text-sm">Load the current homepage or add blocks from the library.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminHome() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [documentId, setDocumentId] = useState("");
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [dragUid, setDragUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [compatibilityMode, setCompatibilityMode] = useState(false);

  useEffect(() => {
    async function loadHomepageBuilder() {
      setLoading(true);
      setError("");
      setStatus("");

      try {
        let initialBlocks: HomepageBlock[] = [];

        const { data: documentData, error: documentError } = await supabase
          .from("cms_homepage_documents")
          .select("*")
          .eq("slug", DOCUMENT_SLUG)
          .maybeSingle();

        if (documentError && !/cms_homepage_documents/.test(documentError.message)) {
          throw documentError;
        }

        if (documentData && Array.isArray((documentData as HomepageDocumentRow).blocks)) {
          const hydrated = ((documentData as HomepageDocumentRow).blocks || []).map((block, index) =>
            createHomepageBlock(block.type, { ...block, sortOrder: index })
          );
          initialBlocks = hydrated;
          setDocumentId((documentData as HomepageDocumentRow).id);
          setCompatibilityMode(false);
          setStatus("Loaded the saved homepage document.");
        } else {
          const { data: legacyData, error: legacyError } = await supabase
            .from("cms_home_sections")
            .select("*")
            .order("sort_order", { ascending: true });

          if (legacyError) throw legacyError;

          const legacySections = (legacyData as HomeSection[]) || [];
          initialBlocks = homepageBlocksFromLegacySections(legacySections);
          setCompatibilityMode(true);
          setStatus(
            legacySections.length
              ? "Loaded the current live homepage structure into the block builder."
              : "Loaded the default homepage structure as the starting point."
          );
        }

        setBlocks(initialBlocks);
        setSelectedUid(initialBlocks[0]?.uid || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load homepage builder.");
      } finally {
        setLoading(false);
      }
    }

    void loadHomepageBuilder();
  }, [supabase]);

  const selectedBlock = blocks.find((block) => block.uid === selectedUid) || null;

  function replaceBlocks(nextBlocks: HomepageBlock[], nextStatus: string) {
    const normalized = nextBlocks.map((block, index) => ({ ...block, sortOrder: index }));
    setBlocks(normalized);
    setSelectedUid(normalized[0]?.uid || "");
    setStatus(nextStatus);
    setError("");
  }

  function addBlock(type: HomepageBlockType, seed: Partial<HomepageBlock>) {
    const nextBlock = createHomepageBlock(type, seed);
    setBlocks((current) => [...current, { ...nextBlock, sortOrder: current.length }]);
    setSelectedUid(nextBlock.uid);
    setStatus(`Added ${blockLabel(type)}.`);
  }

  function updateBlock(uid: string, patch: Partial<HomepageBlock>) {
    setBlocks((current) =>
      current.map((block, index) => {
        if (block.uid !== uid) return { ...block, sortOrder: index };

        const next = { ...block, ...patch, sortOrder: index };

        if (patch.type && patch.type !== block.type && (!patch.key || patch.key === block.key)) {
          next.key = `${patch.type}-${slugify(next.title || next.key || patch.type)}`;
        }

        return next;
      })
    );
  }

  function duplicateBlock(uid: string) {
    const source = blocks.find((block) => block.uid === uid);
    if (!source) return;

    const copy = createHomepageBlock(source.type, {
      ...source,
      uid: "",
      legacyId: "",
      key: `${source.type}-${slugify(source.title || source.key)}-${Date.now().toString(36)}`,
      sortOrder: 0,
    });

    setBlocks((current) =>
      current
        .flatMap((block) => (block.uid === uid ? [block, copy] : [block]))
        .map((block, index) => ({ ...block, sortOrder: index }))
    );
    setSelectedUid(copy.uid);
    setStatus(`Duplicated ${blockLabel(source.type)}.`);
  }

  function removeBlock(uid: string) {
    const next = blocks.filter((block) => block.uid !== uid).map((block, index) => ({ ...block, sortOrder: index }));
    setBlocks(next);
    setSelectedUid(next[0]?.uid || "");
    setStatus("Removed block.");
  }

  function moveBlock(fromUid: string, toUid: string) {
    if (!fromUid || fromUid === toUid) return;

    setBlocks((current) => {
      const fromIndex = current.findIndex((item) => item.uid === fromUid);
      const toIndex = current.findIndex((item) => item.uid === toUid);
      if (fromIndex === -1 || toIndex === -1) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((item, index) => ({ ...item, sortOrder: index }));
    });
  }

  async function saveHomepage() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const normalizedBlocks = blocks.map((block, index) => ({
        ...block,
        sortOrder: index,
        key: block.key.trim(),
        title: block.title.trim(),
        subtitle: block.subtitle.trim(),
        eyebrow: block.eyebrow.trim(),
        primaryLabel: block.primaryLabel.trim(),
        primaryHref: block.primaryHref.trim(),
        secondaryLabel: block.secondaryLabel.trim(),
        secondaryHref: block.secondaryHref.trim(),
        mediaUrl: block.mediaUrl.trim(),
        items: block.items.map((item) => item.trim()).filter(Boolean),
      }));

      if (normalizedBlocks.some((block) => !block.key)) {
        throw new Error("Each block needs a valid key before saving.");
      }

      let documentSaved = false;

      const { error: documentError } = await supabase.from("cms_homepage_documents").upsert(
        {
          id: documentId || undefined,
          slug: DOCUMENT_SLUG,
          title: "Homepage",
          blocks: normalizedBlocks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );

      if (documentError) {
        if (!/cms_homepage_documents/.test(documentError.message)) {
          throw documentError;
        }
        setCompatibilityMode(true);
      } else {
        documentSaved = true;
      }

      const legacyPayload = legacySectionsFromHomepageBlocks(normalizedBlocks);
      const managedKeys = normalizedBlocks.map((block) => block.key.trim()).filter(Boolean);

      if (managedKeys.length) {
        const { error: deleteError } = await supabase.from("cms_home_sections").delete().in("key", managedKeys);
        if (deleteError) throw deleteError;
      }

      if (legacyPayload.length) {
        const { error: insertError } = await supabase.from("cms_home_sections").insert(legacyPayload);
        if (insertError) throw insertError;
      }

      setBlocks(normalizedBlocks);
      setStatus(
        documentSaved
          ? "Homepage document saved and synced to the live homepage adapter."
          : "Homepage synced to the live adapter. Run the latest SQL migration to persist block documents."
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save homepage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="wp-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Homepage Builder</h1>
            <p className="mt-2 max-w-4xl text-sm text-slate-600">
              This builder now stores a block document for the homepage and syncs safe compatible data into the live homepage adapter. The public site keeps its current components and layout.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => replaceBlocks(defaultHomepageBlocks(), "Loaded the current homepage structure into the builder.")}
              className="wp-btn"
            >
              Load Current Homepage
            </button>
            <button type="button" onClick={saveHomepage} disabled={saving} className="wp-btn wp-btn-primary">
              {saving ? "Saving..." : "Save Homepage"}
            </button>
          </div>
        </div>
        {compatibilityMode ? (
          <p className="mt-3 text-sm text-amber-700">
            Compatibility mode: run the latest `cms_admin.sql` to enable persistent block documents. The builder will still sync safely to the live homepage through `cms_home_sections`.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {status ? <p className="mt-3 text-sm text-emerald-600">{status}</p> : null}
      </header>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="wp-card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="wp-panel-title text-base text-slate-900">Block Library</h2>
          <p className="mt-1 text-xs text-slate-500">Add structured homepage blocks without touching the public component tree.</p>
          <div className="mt-4 grid gap-3">
            {homepagePalette.map((item) => (
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="wp-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="wp-panel-title text-base text-slate-900">Live Canvas</h2>
                <p className="mt-1 text-xs text-slate-500">Centered working surface using the current homepage structure and styles.</p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{blocks.length} blocks</span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600">Loading homepage blocks...</p>
            ) : (
              <HomepageCanvas
                blocks={blocks}
                selectedUid={selectedUid}
                onSelect={setSelectedUid}
                onDuplicate={duplicateBlock}
                onRemove={removeBlock}
                onDragStart={setDragUid}
                onDrop={(targetUid) => moveBlock(dragUid, targetUid)}
              />
            )}
          </section>

          <aside className="wp-card h-fit p-5 xl:sticky xl:top-24">
            <h2 className="wp-panel-title text-base text-slate-900">Inspector</h2>
            <p className="mt-1 text-xs text-slate-500">Edit the selected block and see the homepage canvas respond immediately.</p>
            {selectedBlock ? (
              <div className="mt-4 grid gap-4">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Block key
                  <input
                    className="wp-field"
                    value={selectedBlock.key}
                    onChange={(event) => updateBlock(selectedBlock.uid, { key: event.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Block type
                  <select
                    className="wp-select"
                    value={selectedBlock.type}
                    onChange={(event) =>
                      updateBlock(selectedBlock.uid, {
                        type: event.target.value as HomepageBlockType,
                        key: `${event.target.value}-${slugify(selectedBlock.title || selectedBlock.key)}`,
                      })
                    }
                  >
                    {homepagePalette.map((item) => (
                      <option key={item.type} value={item.type}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Eyebrow / label
                  <input
                    className="wp-field"
                    value={selectedBlock.eyebrow}
                    onChange={(event) => updateBlock(selectedBlock.uid, { eyebrow: event.target.value })}
                    placeholder="Optional small label above the block"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Title
                  <input
                    className="wp-field"
                    value={selectedBlock.title}
                    onChange={(event) => updateBlock(selectedBlock.uid, { title: event.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Body / copy
                  <textarea
                    className="wp-textarea"
                    rows={selectedBlock.type === "html" ? 8 : 5}
                    value={selectedBlock.subtitle}
                    onChange={(event) => updateBlock(selectedBlock.uid, { subtitle: event.target.value })}
                    placeholder="Primary descriptive copy for this block"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Multi-item content
                  <textarea
                    className="wp-textarea"
                    rows={6}
                    value={selectedBlock.items.join("\n")}
                    onChange={(event) =>
                      updateBlock(selectedBlock.uid, {
                        items: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                      })
                    }
                    placeholder="One line per item"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Primary button label
                  <input
                    className="wp-field"
                    value={selectedBlock.primaryLabel}
                    onChange={(event) => updateBlock(selectedBlock.uid, { primaryLabel: event.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Primary button URL
                  <input
                    className="wp-field"
                    value={selectedBlock.primaryHref}
                    onChange={(event) => updateBlock(selectedBlock.uid, { primaryHref: event.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Secondary button label
                  <input
                    className="wp-field"
                    value={selectedBlock.secondaryLabel}
                    onChange={(event) => updateBlock(selectedBlock.uid, { secondaryLabel: event.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Secondary button URL
                  <input
                    className="wp-field"
                    value={selectedBlock.secondaryHref}
                    onChange={(event) => updateBlock(selectedBlock.uid, { secondaryHref: event.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Media / note field
                  <textarea
                    className="wp-textarea"
                    rows={4}
                    value={selectedBlock.mediaUrl}
                    onChange={(event) => updateBlock(selectedBlock.uid, { mediaUrl: event.target.value })}
                    placeholder="Media URL, demo URL, or internal preview note"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Visibility
                  <select
                    className="wp-select"
                    value={selectedBlock.enabled ? "enabled" : "hidden"}
                    onChange={(event) => updateBlock(selectedBlock.uid, { enabled: event.target.value === "enabled" })}
                  >
                    <option value="enabled">Enabled</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  <strong className="block text-slate-900">Safe rollout note</strong>
                  This page now edits a homepage block document first, then syncs compatible fields into the current live homepage adapter. Public UI stays on the existing component structure.
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
