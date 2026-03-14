"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
    const matchesSearch =
      !normalizedSearch ||
      item.title?.toLowerCase().includes(normalizedSearch) ||
      item.slug?.toLowerCase().includes(normalizedSearch) ||
      (item.tags || []).join(",").toLowerCase().includes(normalizedSearch) ||
      (item.categories || []).join(",").toLowerCase().includes(normalizedSearch);
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
      published_at: row.published_at || "",
    });
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
      <header className="wp-card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Posts</h1>
        <p className="mt-2 text-sm text-slate-600">Manage blog posts and product updates.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Post editor</h2>
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
              placeholder="post-title"
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
            Tags (comma separated)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700">
            Categories (comma separated)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.categories}
              onChange={(e) => setForm((prev) => ({ ...prev, categories: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={savePost}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update post" : "Create post"}
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

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Existing posts</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading posts...</p>
        ) : filteredPosts.length ? (
          <>
            <div className="wp-controls">
              <div className="wp-bulk">
                <select
                  className="wp-select"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="none">Bulk actions</option>
                  <option value="delete">Delete</option>
                </select>
                <button type="button" className="wp-btn" onClick={applyBulkAction}>
                  Apply
                </button>
                <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
              </div>
              <div className="wp-group">
                <select
                  className="wp-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
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
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
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
                {pagedPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="wp-checkbox"
                        checked={selectedIds.includes(post.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedIds((prev) =>
                            checked ? [...prev, post.id] : prev.filter((id) => id !== post.id),
                          );
                        }}
                      />
                    </td>
                    <td className="font-semibold text-slate-900">{post.title}</td>
                    <td className="text-slate-600">/{post.slug}</td>
                    <td>
                      <span className={`wp-pill ${post.status === "published" ? "is-live" : ""}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="text-slate-600">
                      {post.updated_at ? new Date(post.updated_at).toLocaleDateString() : "-"}
                    </td>
                    <td>
                      <div className="wp-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
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
              <button
                type="button"
                className="wp-btn"
                disabled={activePage === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
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
