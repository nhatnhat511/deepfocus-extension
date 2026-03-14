"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const STATUS_OPTIONS = ["draft", "scheduled", "published", "archived"] as const;

type PageRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
};

const emptyForm = {
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  status: "draft",
  seo_title: "",
  seo_description: "",
  og_image_url: "",
  published_at: "",
};

export default function AdminPages() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...emptyForm });

  async function loadPages() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (fetchError) throw fetchError;
      setPages((data as PageRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPages();
  }, []);

  function startEdit(row: PageRow) {
    setForm({
      id: row.id,
      slug: row.slug || "",
      title: row.title || "",
      excerpt: row.excerpt || "",
      content: row.content || "",
      status: row.status || "draft",
      seo_title: row.seo_title || "",
      seo_description: row.seo_description || "",
      og_image_url: row.og_image_url || "",
      published_at: row.published_at || "",
    });
  }

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function savePage() {
    if (!form.slug.trim() || !form.title.trim()) {
      setError("Slug and title are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim() || null,
        status: form.status,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        og_image_url: form.og_image_url.trim() || null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_pages").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_pages").insert(payload);
        if (insertError) throw insertError;
      }
      resetForm();
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save page.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_pages").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete page.");
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Pages</h1>
        <p className="mt-2 text-sm text-slate-600">Create and manage static pages like FAQ, Pricing, or Support.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Page editor</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            Slug
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="privacy"
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Excerpt
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Content
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={6}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Publish at
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.published_at}
              onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            SEO title
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.seo_title}
              onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            SEO description
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.seo_description}
              onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            OG image URL
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.og_image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, og_image_url: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={savePage}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update page" : "Create page"}
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
        <h2 className="text-base font-semibold text-slate-900">Existing pages</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading pages...</p>
        ) : pages.length ? (
          <div className="mt-4 space-y-3">
            {pages.map((page) => (
              <div key={page.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{page.title}</p>
                  <p className="text-xs text-slate-600">/{page.slug} - {page.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(page)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePage(page.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No pages created yet.</p>
        )}
      </section>
    </section>
  );
}

