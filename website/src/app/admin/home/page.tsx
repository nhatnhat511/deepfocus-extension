"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "@/lib/cms/homepageBlocks";
import { HomepageRenderer } from "@/components/homepage/HomepageRenderer";
import { buildHomepageRenderModelFromBlocks } from "@/lib/cms/homepageRenderModel";

type HomepageDocumentRow = {
  id: string;
  slug: string;
  title: string;
  blocks: HomepageBlock[] | null;
};

const DOCUMENT_SLUG = "homepage";

function blockLabel(type: HomepageBlockType) {
  return homepagePalette.find((item) => item.type === type)?.label || type;
}

function inspectorFieldClass(isFocused: boolean) {
  return `grid gap-1 rounded-xl border px-3 py-3 text-xs font-semibold ${isFocused ? "border-sky-300 bg-sky-50 text-sky-800 ring-2 ring-sky-100" : "border-slate-200 text-slate-600"}`;
}

function parseBooleanSetting(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["1", "true", "yes", "on", "enabled"].includes(value.trim().toLowerCase());
  }
  if (typeof value === "object" && value !== null && "enabled" in (value as Record<string, unknown>)) {
    return Boolean((value as { enabled?: unknown }).enabled);
  }
  return false;
}

export default function AdminHome() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [documentId, setDocumentId] = useState("");
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState("");
  const [selectedUid, setSelectedUid] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [dragUid, setDragUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [compatibilityMode, setCompatibilityMode] = useState(false);
  const [publicFlexAllowlist, setPublicFlexAllowlist] = useState("");
  const [flexSaving, setFlexSaving] = useState(false);
  const [flexStatus, setFlexStatus] = useState("");
  const [publicHtmlRenderEnabled, setPublicHtmlRenderEnabled] = useState(false);
  const [htmlSaving, setHtmlSaving] = useState(false);
  const [htmlStatus, setHtmlStatus] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number; label: string } | null>(null);
  const [previewPublic, setPreviewPublic] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(true);
  const inspectorRefs = useRef<Record<string, HTMLLabelElement | null>>({});
  const subtitleRef = useRef<HTMLTextAreaElement | null>(null);
  const subtitleHistoryRef = useRef(new Map<string, { past: string[]; future: string[] }>());

  const normalizeBlocks = useCallback((source: HomepageBlock[]) => {
    return source.map((block, index) => ({
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
  }, []);

  const snapshotBlocks = useCallback((source: HomepageBlock[]) => {
    return JSON.stringify(normalizeBlocks(source));
  }, [normalizeBlocks]);

  useEffect(() => {
    async function loadHomepageBuilder() {
      setLoading(true);
      setError("");
      setStatus("");
      setFlexStatus("");

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

        const { data: flexSetting } = await supabase
          .from("cms_site_settings")
          .select("value")
          .eq("key", "homepage_flex_allowlist")
          .maybeSingle();

        if (flexSetting?.value) {
          if (typeof flexSetting.value === "string") {
            setPublicFlexAllowlist(flexSetting.value);
          } else if (typeof flexSetting.value === "object" && flexSetting.value !== null && "allowlist" in flexSetting.value) {
            const allowlist = (flexSetting.value as { allowlist?: string }).allowlist ?? "";
            setPublicFlexAllowlist(allowlist);
          }
        } else {
          setPublicFlexAllowlist("");
        }

        const { data: htmlSetting } = await supabase
          .from("cms_site_settings")
          .select("value")
          .eq("key", "homepage_html_render")
          .maybeSingle();

        setPublicHtmlRenderEnabled(parseBooleanSetting(htmlSetting?.value));

        setBlocks(initialBlocks);
        setSelectedUid(initialBlocks[0]?.uid || "");
        setLastSavedSnapshot(snapshotBlocks(initialBlocks));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load homepage builder.");
      } finally {
        setLoading(false);
      }
    }

    void loadHomepageBuilder();
  }, [snapshotBlocks, supabase]);

  const selectedBlock = blocks.find((block) => block.uid === selectedUid) || null;
  const flexBlocks = blocks.filter(
    (block) =>
      !["hero", "hero-highlights", "feature-card", "steps", "audience", "proof-grid", "cta"].includes(block.type)
  );
  const allowlistTokens = publicFlexAllowlist
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowlistSet = new Set(allowlistTokens);
  const flexKeys = new Set(flexBlocks.map((block) => block.key));
  const invalidAllowlist = allowlistTokens.filter((key) => !flexKeys.has(key));
  const enabledCount =
    publicFlexAllowlist.trim() === "*"
      ? flexBlocks.length
      : flexBlocks.filter((block) => allowlistSet.has(block.key)).length;
  const hasUnsavedChanges = !!blocks.length && snapshotBlocks(blocks) !== lastSavedSnapshot;

  useEffect(() => {
    if (!selectedField) return;

    const target = inspectorRefs.current[selectedField];
    if (!target) return;

    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const focusable = target.querySelector("input, textarea, select") as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    focusable?.focus();
  }, [selectedField, selectedUid]);

  useEffect(() => {
    if (!selectedUid || !selectedField) {
      setToolbarPosition(null);
      return;
    }

    const updateToolbar = () => {
      const selector = `[data-editor-block="${selectedUid}"][data-editor-field="${selectedField}"]`;
      const target = document.querySelector(selector) as HTMLElement | null;
      if (!target) {
        setToolbarPosition(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const label = target.getAttribute("data-editor-label") || "Field";
      setToolbarPosition({
        top: rect.top + window.scrollY - 12,
        left: rect.left + window.scrollX + rect.width / 2,
        label,
      });
    };

    updateToolbar();
    window.addEventListener("scroll", updateToolbar, true);
    window.addEventListener("resize", updateToolbar);

    return () => {
      window.removeEventListener("scroll", updateToolbar, true);
      window.removeEventListener("resize", updateToolbar);
    };
  }, [previewPublic, selectedField, selectedUid]);

  async function saveFlexAllowlist() {
    setFlexSaving(true);
    setFlexStatus("");

    try {
      const { error: flexError } = await supabase.from("cms_site_settings").upsert({
        key: "homepage_flex_allowlist",
        value: publicFlexAllowlist,
        updated_at: new Date().toISOString(),
      });

      if (flexError) throw flexError;
      setFlexStatus("Public flex block visibility updated.");
    } catch (flexError) {
      setFlexStatus(flexError instanceof Error ? flexError.message : "Unable to save flex block visibility.");
    } finally {
      setFlexSaving(false);
    }
  }

  async function saveHtmlRenderSetting() {
    setHtmlSaving(true);
    setHtmlStatus("");

    try {
      const { error: htmlError } = await supabase.from("cms_site_settings").upsert({
        key: "homepage_html_render",
        value: publicHtmlRenderEnabled ? "enabled" : "",
        updated_at: new Date().toISOString(),
      });

      if (htmlError) throw htmlError;
      setHtmlStatus("Public HTML rendering updated.");
    } catch (htmlError) {
      setHtmlStatus(htmlError instanceof Error ? htmlError.message : "Unable to save HTML rendering setting.");
    } finally {
      setHtmlSaving(false);
    }
  }

  async function copyKeyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFlexStatus(`Copied ${value}`);
    } catch {
      setFlexStatus("Unable to copy. Copy manually from the list.");
    }
  }

  function insertMarkdown(prefix: string, suffix: string, placeholder: string) {
    if (!selectedBlock) return;
    const fieldValue = selectedBlock.subtitle;
    const textarea = subtitleRef.current;
    if (!textarea) {
      updateBlock(selectedBlock.uid, { subtitle: `${fieldValue}${prefix}${placeholder}${suffix}` });
      return;
    }

    const start = textarea.selectionStart ?? fieldValue.length;
    const end = textarea.selectionEnd ?? fieldValue.length;
    const before = fieldValue.slice(0, start);
    const middle = fieldValue.slice(start, end) || placeholder;
    const after = fieldValue.slice(end);
    const nextValue = `${before}${prefix}${middle}${suffix}${after}`;

    updateBlock(selectedBlock.uid, { subtitle: nextValue });
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + prefix.length + middle.length + suffix.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function getSubtitleHistory(uid: string) {
    let entry = subtitleHistoryRef.current.get(uid);
    if (!entry) {
      entry = { past: [], future: [] };
      subtitleHistoryRef.current.set(uid, entry);
    }
    return entry;
  }

  function trackSubtitleChange(uid: string, nextValue: string) {
    const history = getSubtitleHistory(uid);
    const currentValue = blocks.find((block) => block.uid === uid)?.subtitle ?? "";
    if (currentValue === nextValue) return;
    history.past.push(currentValue);
    history.future = [];
  }

  function undoSubtitle(uid: string) {
    const history = getSubtitleHistory(uid);
    if (!history.past.length) return;
    const currentValue = blocks.find((block) => block.uid === uid)?.subtitle ?? "";
    const previous = history.past.pop() ?? "";
    history.future.push(currentValue);
    updateBlock(uid, { subtitle: previous });
  }

  function redoSubtitle(uid: string) {
    const history = getSubtitleHistory(uid);
    if (!history.future.length) return;
    const currentValue = blocks.find((block) => block.uid === uid)?.subtitle ?? "";
    const nextValue = history.future.pop() ?? "";
    history.past.push(currentValue);
    updateBlock(uid, { subtitle: nextValue });
  }

  function renderInlineMarkdown(source: string) {
    const nodes: React.ReactNode[] = [];
    let remaining = source;
    let key = 0;

    const patterns = [
      { type: "link", regex: /\[([^\]]+?)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/ },
      { type: "bold", regex: /\*\*([^*]+?)\*\*/ },
      { type: "italic", regex: /\*([^*]+?)\*/ },
    ];

    const pushText = (text: string) => {
      const parts = text.split("\n");
      parts.forEach((part, index) => {
        if (part) {
          nodes.push(<span key={`t-${key++}`}>{part}</span>);
        }
        if (index < parts.length - 1) {
          nodes.push(<br key={`br-${key++}`} />);
        }
      });
    };

    while (remaining.length) {
      let earliestMatch: RegExpExecArray | null = null;
      let matchedType: string | null = null;
      let matchedIndex = -1;

      for (const pattern of patterns) {
        const match = pattern.regex.exec(remaining);
        if (!match) continue;
        if (matchedIndex === -1 || match.index < matchedIndex) {
          earliestMatch = match;
          matchedType = pattern.type;
          matchedIndex = match.index;
        }
      }

      if (!earliestMatch || matchedType === null) {
        pushText(remaining);
        break;
      }

      if (matchedIndex > 0) {
        pushText(remaining.slice(0, matchedIndex));
      }

      if (matchedType === "link") {
        const [, label, href] = earliestMatch;
        nodes.push(
          <a key={`lnk-${key++}`} href={href} className="text-sky-700 underline decoration-sky-300" target="_blank" rel="noreferrer">
            {label}
          </a>
        );
      } else if (matchedType === "bold") {
        nodes.push(
          <strong key={`b-${key++}`} className="font-semibold text-slate-900">
            {earliestMatch[1]}
          </strong>
        );
      } else if (matchedType === "italic") {
        nodes.push(
          <em key={`i-${key++}`} className="italic">
            {earliestMatch[1]}
          </em>
        );
      }

      remaining = remaining.slice(matchedIndex + earliestMatch[0].length);
    }

    return nodes;
  }

  function updateAllowlist(next: Set<string>) {
    const normalized = Array.from(next).filter(Boolean).sort().join(",");
    setPublicFlexAllowlist(normalized);
  }

  function replaceBlocks(nextBlocks: HomepageBlock[], nextStatus: string) {
    const normalized = nextBlocks.map((block, index) => ({ ...block, sortOrder: index }));
    setBlocks(normalized);
    setSelectedUid(normalized[0]?.uid || "");
    setSelectedField("");
    setStatus(nextStatus);
    setError("");
  }

  function addBlock(type: HomepageBlockType, seed: Partial<HomepageBlock>) {
    const nextBlock = createHomepageBlock(type, seed);
    setBlocks((current) => [...current, { ...nextBlock, sortOrder: current.length }]);
    setSelectedUid(nextBlock.uid);
    setSelectedField("");
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
    setSelectedField("");
    setStatus(`Duplicated ${blockLabel(source.type)}.`);
  }

  function removeBlock(uid: string) {
    const next = blocks.filter((block) => block.uid !== uid).map((block, index) => ({ ...block, sortOrder: index }));
    setBlocks(next);
    setSelectedUid(next[0]?.uid || "");
    setSelectedField("");
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

  function handleInlineChange(uid: string, field: string, value: string) {
    if (field === "items") {
      updateBlock(uid, { items: value.split("\n").map((item) => item.trim()).filter(Boolean) });
      return;
    }

    if (field === "enabled") {
      updateBlock(uid, { enabled: value === "enabled" });
      return;
    }

    updateBlock(uid, { [field]: value } as Partial<HomepageBlock>);
  }

  async function saveHomepage() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const normalizedBlocks = normalizeBlocks(blocks);

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
      setLastSavedSnapshot(JSON.stringify(normalizedBlocks));
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
      {toolbarPosition ? (
        <div
          className="pointer-events-auto fixed z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-lg"
          style={{
            top: toolbarPosition.top,
            left: toolbarPosition.left,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="uppercase tracking-[0.2em]">{toolbarPosition.label}</span>
          <button
            type="button"
            onClick={() => selectedUid && duplicateBlock(selectedUid)}
            className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => selectedUid && removeBlock(selectedUid)}
            className="rounded-full border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-600 hover:text-rose-700"
          >
            Remove
          </button>
        </div>
      ) : null}
      <header className="wp-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Homepage Builder</h1>
            <p className="mt-2 max-w-4xl text-sm text-slate-600">
              This builder now stores a block document for the homepage and syncs safe compatible data into the live homepage adapter. The public site keeps its current components and layout.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`rounded-full px-3 py-1 ${hasUnsavedChanges ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              </span>
              <span className="text-slate-500">{compatibilityMode ? "Syncing through compatibility mode." : "Block document mode active."}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => replaceBlocks(defaultHomepageBlocks(), "Loaded the current homepage structure into the builder.")}
              className="wp-btn"
            >
              Load Current Homepage
            </button>
            <button type="button" onClick={saveHomepage} disabled={saving || !hasUnsavedChanges} className="wp-btn wp-btn-primary">
              {saving ? "Saving..." : "Save Homepage"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">Public flex blocks visibility</div>
          <p className="text-slate-600">
            Use comma-separated block keys to enable flex blocks on the public homepage. Leave empty to keep them admin-only. Use `*` to enable all.
          </p>
          <input
            className="wp-field"
            value={publicFlexAllowlist}
            onChange={(event) => setPublicFlexAllowlist(event.target.value)}
            placeholder="columns-2-hero,video-demo"
          />
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Enabled: {enabledCount}</span>
            {invalidAllowlist.length ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                Unknown keys: {invalidAllowlist.join(", ")}
              </span>
            ) : null}
          </div>
          {flexBlocks.length ? (
            <div className="grid gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Flex blocks in this homepage</div>
              <div className="grid gap-2">
                {flexBlocks.map((block) => {
                  const isEnabled = publicFlexAllowlist.trim() === "*" || allowlistSet.has(block.key);
                  return (
                    <label key={block.uid} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800">{block.key}</div>
                        <div className="text-[11px] text-slate-500">{block.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedUid(block.uid);
                            setSelectedField("");
                          }}
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                          onClick={(event) => {
                            event.preventDefault();
                            void copyKeyToClipboard(block.key);
                          }}
                        >
                          Copy key
                        </button>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(event) => {
                            const next = new Set(allowlistSet);
                            if (publicFlexAllowlist.trim() === "*") {
                              next.clear();
                            }
                            if (event.target.checked) {
                              next.add(block.key);
                            } else {
                              next.delete(block.key);
                            }
                            updateAllowlist(next);
                          }}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              No flex blocks yet. Add image/video/html/columns blocks to see toggles here.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="wp-btn"
              onClick={() => setPublicFlexAllowlist("")}
            >
              Disable public flex blocks
            </button>
            <button
              type="button"
              className="wp-btn"
              onClick={() => updateAllowlist(new Set(flexBlocks.map((block) => block.key)))}
            >
              Enable all in this page
            </button>
            <button
              type="button"
              className="wp-btn"
              onClick={() => setPublicFlexAllowlist("*")}
            >
              Enable all
            </button>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={saveFlexAllowlist}
              disabled={flexSaving}
            >
              {flexSaving ? "Saving..." : "Save visibility"}
            </button>
          </div>
          {flexStatus ? <div className="text-xs font-semibold text-slate-600">{flexStatus}</div> : null}
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">HTML render toggle</div>
          <p className="text-slate-600">
            Enable sanitized HTML rendering for public homepage blocks. Keep off if you only want to display HTML code.
          </p>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800">Render HTML blocks on public site</div>
              <div className="text-[11px] text-slate-500">Allowed tags only, scripts are stripped.</div>
            </div>
            <input
              type="checkbox"
              checked={publicHtmlRenderEnabled}
              onChange={(event) => setPublicHtmlRenderEnabled(event.target.checked)}
            />
          </label>
          <button
            type="button"
            className="wp-btn wp-btn-primary w-fit"
            onClick={saveHtmlRenderSetting}
            disabled={htmlSaving}
          >
            {htmlSaving ? "Saving..." : "Save HTML render"}
          </button>
          {htmlStatus ? <div className="text-xs font-semibold text-slate-600">{htmlStatus}</div> : null}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{blocks.length} blocks</span>
                <button
                  type="button"
                  onClick={() => setPreviewPublic((prev) => !prev)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  {previewPublic ? "Exit Public Preview" : "Preview Public"}
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600">Loading homepage blocks...</p>
            ) : (
              <HomepageRenderer
                model={buildHomepageRenderModelFromBlocks(blocks)}
                flexAllowlist={publicFlexAllowlist}
                htmlRenderEnabled={publicHtmlRenderEnabled}
                editable={
                  previewPublic
                    ? undefined
                    : {
                        selectedId: selectedUid,
                        selectedField,
                        onSelect: (id) => {
                          setSelectedUid(id);
                          setSelectedField("");
                        },
                        onFocusField: (id, field) => {
                          setSelectedUid(id);
                          setSelectedField(field);
                        },
                        onInlineChange: handleInlineChange,
                        onDuplicate: duplicateBlock,
                        onRemove: removeBlock,
                        onDragStart: setDragUid,
                        onDrop: (targetUid) => moveBlock(dragUid, targetUid),
                      }
                }
              />
            )}
          </section>

          <aside className="wp-card h-fit p-5 xl:sticky xl:top-24">
            <h2 className="wp-panel-title text-base text-slate-900">Inspector</h2>
            <p className="mt-1 text-xs text-slate-500">Edit the selected block and see the homepage canvas respond immediately.</p>
            {selectedBlock ? (
              <div className="mt-4 grid gap-4">
                <label ref={(node) => {
                  inspectorRefs.current.key = node;
                }} className={inspectorFieldClass(selectedField === "key")}>
                  Block key
                  <input
                    className="wp-field"
                    value={selectedBlock.key}
                    onChange={(event) => updateBlock(selectedBlock.uid, { key: event.target.value })}
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.type = node;
                }} className={inspectorFieldClass(selectedField === "type")}>
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
                <label ref={(node) => {
                  inspectorRefs.current.eyebrow = node;
                }} className={inspectorFieldClass(selectedField === "eyebrow")}>
                  Eyebrow / label
                  <input
                    className="wp-field"
                    value={selectedBlock.eyebrow}
                    onChange={(event) => updateBlock(selectedBlock.uid, { eyebrow: event.target.value })}
                    placeholder="Optional small label above the block"
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.title = node;
                }} className={inspectorFieldClass(selectedField === "title")}>
                  Title
                  <input
                    className="wp-field"
                    value={selectedBlock.title}
                    onChange={(event) => updateBlock(selectedBlock.uid, { title: event.target.value })}
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.subtitle = node;
                }} className={inspectorFieldClass(selectedField === "subtitle")}>
                  Body / copy
                  <textarea
                    ref={subtitleRef}
                    className="wp-textarea"
                    rows={selectedBlock.type === "html" ? 8 : 5}
                    value={selectedBlock.subtitle}
                    onChange={(event) => {
                      trackSubtitleChange(selectedBlock.uid, event.target.value);
                      updateBlock(selectedBlock.uid, { subtitle: event.target.value });
                    }}
                    placeholder="Primary descriptive copy for this block"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => insertMarkdown("**", "**", "bold text")}
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => insertMarkdown("*", "*", "italic text")}
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => insertMarkdown("[", "](https://example.com)", "link")}
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-40"
                      onClick={() => undoSubtitle(selectedBlock.uid)}
                      disabled={!getSubtitleHistory(selectedBlock.uid).past.length}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-40"
                      onClick={() => redoSubtitle(selectedBlock.uid)}
                      disabled={!getSubtitleHistory(selectedBlock.uid).future.length}
                    >
                      Redo
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => setShowMarkdownPreview((prev) => !prev)}
                    >
                      {showMarkdownPreview ? "Hide preview" : "Show preview"}
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Supports **bold**, *italic*, and [link](https://example.com)
                  </span>
                  {showMarkdownPreview ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      {renderInlineMarkdown(selectedBlock.subtitle || "Preview text")}
                    </div>
                  ) : null}
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.items = node;
                }} className={inspectorFieldClass(selectedField === "items")}>
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
                <label ref={(node) => {
                  inspectorRefs.current.primaryLabel = node;
                }} className={inspectorFieldClass(selectedField === "primaryLabel")}>
                  Primary button label
                  <input
                    className="wp-field"
                    value={selectedBlock.primaryLabel}
                    onChange={(event) => updateBlock(selectedBlock.uid, { primaryLabel: event.target.value })}
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.primaryHref = node;
                }} className={inspectorFieldClass(selectedField === "primaryHref")}>
                  Primary button URL
                  <input
                    className="wp-field"
                    value={selectedBlock.primaryHref}
                    onChange={(event) => updateBlock(selectedBlock.uid, { primaryHref: event.target.value })}
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.secondaryLabel = node;
                }} className={inspectorFieldClass(selectedField === "secondaryLabel")}>
                  Secondary button label
                  <input
                    className="wp-field"
                    value={selectedBlock.secondaryLabel}
                    onChange={(event) => updateBlock(selectedBlock.uid, { secondaryLabel: event.target.value })}
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.secondaryHref = node;
                }} className={inspectorFieldClass(selectedField === "secondaryHref")}>
                  Secondary button URL
                  <input
                    className="wp-field"
                    value={selectedBlock.secondaryHref}
                    onChange={(event) => updateBlock(selectedBlock.uid, { secondaryHref: event.target.value })}
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.mediaUrl = node;
                }} className={inspectorFieldClass(selectedField === "mediaUrl")}>
                  Media / note field
                  <textarea
                    className="wp-textarea"
                    rows={4}
                    value={selectedBlock.mediaUrl}
                    onChange={(event) => updateBlock(selectedBlock.uid, { mediaUrl: event.target.value })}
                    placeholder="Media URL, demo URL, or internal preview note"
                  />
                </label>
                <label ref={(node) => {
                  inspectorRefs.current.enabled = node;
                }} className={inspectorFieldClass(selectedField === "enabled")}>
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

