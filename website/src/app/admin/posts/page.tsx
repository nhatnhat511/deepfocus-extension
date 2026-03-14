"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import RichTextEditor from "@/components/admin/RichTextEditor";

const STATUS_OPTIONS = ["draft", "scheduled", "published", "archived"] as const;

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  tags: string[] | null;
  categories: string[] | null;
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
  tags: "",
  categories: "",
  published_at: "",
};

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPosts() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [posts, setPosts] = useState<PostRow[]>([]);
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

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_posts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (fetchError) throw fetchError;
      setPosts((data as PostRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredPosts = posts.filter((item) => {
    const haystack = [item.title, item.slug, (item.tags || []).join(","), (item.categories || []).join(",")]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedPosts = filteredPosts.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentIds = pagedPosts.map((item) => item.id);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function startEdit(row: PostRow) {
    setForm({
      id: row.id,
      slug: row.slug || "",
      title: row.title || "",
      excerpt: row.excerpt || "",
      content: row.content || "",
      status: row.status || "draft",
      tags: row.tags ? row.tags.join(", ") : "",
      categories: row.categories ? row.categories.join(", ") : "",
      published_at: row.published_at ? row.published_at.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function savePost() {
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
        tags: parseList(form.tags),
        categories: parseList(form.categories),
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };

      if (form.id) {
        const { error: updateError } = await supabase.from("cms_posts").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_posts").insert(payload);
        if (insertError) throw insertError;
      }

      resetForm();
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save post.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_posts").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete post.");
    }
  }

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.from("cms_posts").delete().in("id", selectedIds);
      if (bulkError) throw bulkError;
      setSelectedIds([]);
      setBulkAction("none");
      await loadPosts();
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
          <h1 className="wp-page-title">Posts</h1>
          <p className="mt-1 text-sm text-slate-600">Author posts with a WordPress-like editor, publish box, and taxonomy controls.</p>
        </div>
        <button type="button" className="wp-btn" onClick={resetForm}>
          Add New
        </button>
      </header>

      {error ? (
        <section className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <section className="wp-metabox">
            <div className="wp-metabox-body space-y-4">
              <input
                className="wp-field text-3xl font-semibold"
                placeholder="Add title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                className="wp-field"
                placeholder="Slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Content</div>
            <div className="wp-metabox-body">
              <RichTextEditor
                value={form.content}
                onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                placeholder="Start writing your post..."
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
                <button type="button" className="wp-btn wp-btn-primary" onClick={savePost} disabled={saving}>
                  {saving ? "Saving..." : form.id ? "Update" : "Publish"}
                </button>
                <button type="button" className="wp-btn" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Categories</div>
            <div className="wp-metabox-body">
              <textarea
                className="wp-textarea"
                placeholder="productivity, updates"
                value={form.categories}
                onChange={(e) => setForm((prev) => ({ ...prev, categories: e.target.value }))}
              />
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Tags</div>
            <div className="wp-metabox-body">
              <textarea
                className="wp-textarea"
                placeholder="focus, timer, chrome"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Featured Image</div>
            <div className="wp-metabox-body">
              <p className="text-sm text-slate-600">
                Use the Media Library to upload artwork, then paste its URL into the content or excerpt workflow.
              </p>
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Summary</div>
            <div className="wp-metabox-body">
              <textarea
                className="wp-textarea"
                placeholder="Short excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              />
            </div>
          </section>
        </aside>
      </section>

      <section className="wp-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="wp-panel-title text-base">All Posts</h2>
          <span className="text-xs text-slate-500">{filteredPosts.length} items</span>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading posts...</p>
        ) : filteredPosts.length ? (
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
                  placeholder="Search posts..."
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
                  {pagedPosts.map((item) => (
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
                          <button type="button" className="wp-btn wp-btn-danger" onClick={() => deletePost(item.id)}>
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
                Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredPosts.length)} of{" "}
                {filteredPosts.length}
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
          <p className="mt-3 text-sm text-slate-600">No posts match the current filters.</p>
        )}
      </section>
    </section>
  );
}
