"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import RichTextEditor from "@/components/admin/RichTextEditor";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("none");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredPages = pages.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.slug.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedPages = filteredPages.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentIds = pagedPages.map((item) => item.id);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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
      published_at: row.published_at ? row.published_at.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.from("cms_pages").delete().in("id", selectedIds);
      if (bulkError) throw bulkError;
      setSelectedIds([]);
      setBulkAction("none");
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply bulk action.");
    }
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="wp-page-title">Pages</h1>
          <p className="mt-1 text-sm text-slate-600">Edit static pages with a WordPress-style authoring layout.</p>
        </div>
        <button type="button" className="wp-btn" onClick={resetForm}>
          Add New
        </button>
      </header>

      {error ? (
        <section className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          <section className="wp-metabox">
            <div className="wp-metabox-body space-y-4">
              <input
                className="wp-field text-3xl font-semibold"
                placeholder="Add title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <div className="grid gap-3 md:grid-cols-[1fr,220px]">
                <input
                  className="wp-field"
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                />
                <input
                  className="wp-field"
                  placeholder="Page folder / section"
                  value={form.seo_title}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Content</div>
            <div className="wp-metabox-body">
              <RichTextEditor
                value={form.content}
                onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                placeholder="Write your page content here..."
              />
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Excerpt</div>
            <div className="wp-metabox-body">
              <textarea
                className="wp-textarea"
                placeholder="Optional summary"
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="wp-metabox">
            <div className="wp-metabox-title">Publish</div>
            <div className="wp-metabox-body space-y-3">
              <select
                className="wp-select"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="wp-field"
                value={form.published_at}
                onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
              />
              <div className="flex gap-2">
                <button type="button" className="wp-btn wp-btn-primary" onClick={savePage} disabled={saving}>
                  {saving ? "Saving..." : form.id ? "Update" : "Publish"}
                </button>
                <button type="button" className="wp-btn" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Featured Image</div>
            <div className="wp-metabox-body space-y-3">
              <input
                className="wp-field"
                placeholder="https://..."
                value={form.og_image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, og_image_url: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Use a URL from the Media Library for the featured image.</p>
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">SEO</div>
            <div className="wp-metabox-body space-y-3">
              <textarea
                className="wp-textarea"
                placeholder="SEO description"
                value={form.seo_description}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
              />
            </div>
          </section>
        </aside>
      </section>

      <section className="wp-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="wp-panel-title text-base">All Pages</h2>
          <span className="text-xs text-slate-500">{filteredPages.length} items</span>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading pages...</p>
        ) : filteredPages.length ? (
          <>
            <div className="wp-controls">
              <div className="wp-bulk">
                <select className="wp-select" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                  <option value="none">Bulk actions</option>
                  <option value="delete">Delete</option>
                </select>
                <button type="button" className="wp-btn" onClick={applyBulkAction}>
                  Apply
                </button>
                <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
              </div>
              <div className="wp-group">
                <select className="wp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="wp-search">
                <input
                  className="wp-input"
                  placeholder="Search pages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 overflow-hidden border border-slate-200 bg-white">
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="wp-checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPages.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="wp-checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedIds((prev) =>
                              checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                            );
                          }}
                        />
                      </td>
                      <td className="font-semibold">{item.title}</td>
                      <td>/{item.slug}</td>
                      <td>
                        <span className={`wp-pill ${item.status === "published" ? "is-live" : ""}`}>{item.status}</span>
                      </td>
                      <td>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <div className="wp-actions">
                          <button type="button" className="wp-btn" onClick={() => startEdit(item)}>
                            Edit
                          </button>
                          <button type="button" className="wp-btn wp-btn-danger" onClick={() => deletePage(item.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredPages.length)} of{" "}
                {filteredPages.length}
              </span>
              <div className="wp-pagination">
                <button type="button" className="wp-btn" disabled={activePage === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                  Previous
                </button>
                <span className="wp-muted">
                  Page {activePage} of {pageCount}
                </span>
                <button
                  type="button"
                  className="wp-btn"
                  disabled={activePage === pageCount}
                  onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No pages match the current filters.</p>
        )}
      </section>
    </section>
  );
}
