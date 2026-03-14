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

const emptySection = {
  id: "",
  key: "",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_href: "",
  image_url: "",
  is_enabled: true,
  sort_order: 0,
};

export default function AdminHome() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [form, setForm] = useState({ ...emptySection });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSections() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_home_sections")
        .select("*")
        .order("sort_order", { ascending: true });
      if (fetchError) throw fetchError;
      setSections((data as HomeSection[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load homepage sections.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSections();
  }, []);

  function startEdit(section: HomeSection) {
    setForm({
      id: section.id,
      key: section.key || "",
      title: section.title || "",
      subtitle: section.subtitle || "",
      cta_label: section.cta_label || "",
      cta_href: section.cta_href || "",
      image_url: section.image_url || "",
      is_enabled: section.is_enabled ?? true,
      sort_order: section.sort_order ?? 0,
    });
  }

  function resetForm() {
    setForm({ ...emptySection });
  }

  async function saveSection() {
    if (!form.key.trim()) {
      setError("Section key is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        key: form.key.trim(),
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        cta_label: form.cta_label.trim() || null,
        cta_href: form.cta_href.trim() || null,
        image_url: form.image_url.trim() || null,
        is_enabled: !!form.is_enabled,
        sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
      };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_home_sections").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_home_sections").insert(payload);
        if (insertError) throw insertError;
      }
      resetForm();
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save section.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_home_sections").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete section.");
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Homepage Builder</h1>
        <p className="mt-2 text-sm text-slate-600">Define hero, feature blocks, and CTAs for the homepage.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Section editor</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Section key
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.key}
              onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
              placeholder="hero"
            />
          </label>
          <label className="text-sm text-slate-700">
            Sort order
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Subtitle
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={form.subtitle}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            CTA label
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.cta_label}
              onChange={(e) => setForm((prev) => ({ ...prev, cta_label: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            CTA link
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.cta_href}
              onChange={(e) => setForm((prev) => ({ ...prev, cta_href: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Image URL
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            Enabled
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.is_enabled ? "true" : "false"}
              onChange={(e) => setForm((prev) => ({ ...prev, is_enabled: e.target.value === "true" }))}
            >
              <option value="true">Enabled</option>
              <option value="false">Hidden</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveSection}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update section" : "Create section"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Existing sections</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading sections...</p>
        ) : sections.length ? (
          <div className="mt-4 space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{section.title || section.key}</p>
                  <p className="text-xs text-slate-600">{section.key} - Order {section.sort_order ?? 0}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(section)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSection(section.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No sections created yet.</p>
        )}
      </section>
    </section>
  );
}
