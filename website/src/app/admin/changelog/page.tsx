"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ChangelogRow = {
  id: string;
  title: string;
  release_date: string | null;
  items: string[];
  sort_order: number | null;
  is_published: boolean | null;
};

const emptyForm = {
  id: "",
  title: "",
  release_date: "",
  items: [""],
  sort_order: 0,
  is_published: true,
};

export default function AdminChangelog() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [entries, setEntries] = useState<ChangelogRow[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("none");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadEntries() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_changelog")
        .select("*")
        .order("sort_order", { ascending: true });
      if (fetchError) throw fetchError;
      setEntries((data as ChangelogRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load changelog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !normalizedSearch ||
      entry.title?.toLowerCase().includes(normalizedSearch) ||
      (entry.items || []).join(",").toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && entry.is_published) ||
      (statusFilter === "hidden" && !entry.is_published);
    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedEntries = filteredEntries.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentIds = pagedEntries.map((entry) => entry.id);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function updateItem(index: number, value: string) {
    setForm((prev) => {
      const nextItems = prev.items.map((item, i) => (i === index ? value : item));
      return { ...prev, items: nextItems };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, ""] }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  function startEdit(entry: ChangelogRow) {
    setForm({
      id: entry.id,
      title: entry.title || "",
      release_date: entry.release_date || "",
      items: entry.items?.length ? entry.items : [""],
      sort_order: entry.sort_order ?? 0,
      is_published: entry.is_published ?? true,
    });
  }

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function saveEntry() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    const items = form.items.map((item) => item.trim()).filter(Boolean);
    if (!items.length) {
      setError("Add at least one changelog item.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        release_date: form.release_date ? new Date(form.release_date).toISOString().slice(0, 10) : null,
        items,
        sort_order: Number(form.sort_order) || 0,
        is_published: !!form.is_published,
      };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_changelog").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_changelog").insert(payload);
        if (insertError) throw insertError;
      }
      resetForm();
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changelog entry.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_changelog").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete changelog entry.");
    }
  }

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.from("cms_changelog").delete().in("id", selectedIds);
      if (bulkError) throw bulkError;
      setSelectedIds([]);
      setBulkAction("none");
      await loadEntries();
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
        <h1 className="text-2xl font-semibold text-slate-900">Changelog</h1>
        <p className="mt-2 text-sm text-slate-600">Track product updates by release.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Changelog editor</h2>
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
            Release date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.release_date}
              onChange={(e) => setForm((prev) => ({ ...prev, release_date: e.target.value }))}
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
          <label className="text-sm text-slate-700">
            Published
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.is_published ? "true" : "false"}
              onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.value === "true" }))}
            >
              <option value="true">Published</option>
              <option value="false">Hidden</option>
            </select>
          </label>
        </div>
        <div className="mt-4 space-y-2">
          {form.items.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[1fr,auto]">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder="Changelog detail"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Add item
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveEntry}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update entry" : "Create entry"}
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
        <h2 className="wp-panel-title text-base text-slate-900">Entries</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading changelog...</p>
        ) : filteredEntries.length ? (
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
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div className="wp-search">
                <input
                  className="wp-input"
                  placeholder="Search changelog..."
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
                  <th>Release</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="wp-checkbox"
                        checked={selectedIds.includes(entry.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedIds((prev) =>
                            checked ? [...prev, entry.id] : prev.filter((id) => id !== entry.id),
                          );
                        }}
                      />
                    </td>
                    <td className="font-semibold text-slate-900">{entry.title}</td>
                    <td className="text-slate-600">{entry.release_date || "No date"}</td>
                    <td className="text-slate-600">{entry.items?.length || 0}</td>
                    <td>
                      <span className={`wp-pill ${entry.is_published ? "is-live" : ""}`}>
                        {entry.is_published ? "published" : "hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="wp-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
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
              Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredEntries.length)} of{" "}
              {filteredEntries.length}
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
          <p className="mt-3 text-sm text-slate-600">No entries match the current filters.</p>
        )}
      </section>
    </section>
  );
}
