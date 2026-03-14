"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RoadmapRow = {
  id: string;
  stage: string;
  points: string[];
  sort_order: number | null;
  is_published: boolean | null;
};

const emptyForm = {
  id: "",
  stage: "",
  points: [""],
  sort_order: 0,
  is_published: true,
};

export default function AdminRoadmap() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [entries, setEntries] = useState<RoadmapRow[]>([]);
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
        .from("cms_roadmap")
        .select("*")
        .order("sort_order", { ascending: true });
      if (fetchError) throw fetchError;
      setEntries((data as RoadmapRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load roadmap.");
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
      entry.stage?.toLowerCase().includes(normalizedSearch) ||
      (entry.points || []).join(",").toLowerCase().includes(normalizedSearch);
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

  function updatePoint(index: number, value: string) {
    setForm((prev) => {
      const nextPoints = prev.points.map((item, i) => (i === index ? value : item));
      return { ...prev, points: nextPoints };
    });
  }

  function addPoint() {
    setForm((prev) => ({ ...prev, points: [...prev.points, ""] }));
  }

  function removePoint(index: number) {
    setForm((prev) => ({ ...prev, points: prev.points.filter((_, i) => i !== index) }));
  }

  function startEdit(entry: RoadmapRow) {
    setForm({
      id: entry.id,
      stage: entry.stage || "",
      points: entry.points?.length ? entry.points : [""],
      sort_order: entry.sort_order ?? 0,
      is_published: entry.is_published ?? true,
    });
  }

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function saveEntry() {
    if (!form.stage.trim()) {
      setError("Stage name is required.");
      return;
    }
    const points = form.points.map((item) => item.trim()).filter(Boolean);
    if (!points.length) {
      setError("Add at least one roadmap point.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        stage: form.stage.trim(),
        points,
        sort_order: Number(form.sort_order) || 0,
        is_published: !!form.is_published,
      };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_roadmap").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_roadmap").insert(payload);
        if (insertError) throw insertError;
      }
      resetForm();
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save roadmap entry.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_roadmap").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete roadmap entry.");
    }
  }

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.from("cms_roadmap").delete().in("id", selectedIds);
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
        <h1 className="text-2xl font-semibold text-slate-900">Roadmap</h1>
        <p className="mt-2 text-sm text-slate-600">Plan upcoming features and milestones.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Roadmap editor</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Stage name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.stage}
              onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value }))}
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
          {form.points.map((point, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[1fr,auto]">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={point}
                onChange={(e) => updatePoint(index, e.target.value)}
                placeholder="Roadmap detail"
              />
              <button
                type="button"
                onClick={() => removePoint(index)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPoint}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Add point
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveEntry}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update stage" : "Create stage"}
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
        <h2 className="wp-panel-title text-base text-slate-900">Stages</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading roadmap...</p>
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
                  placeholder="Search roadmap..."
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
                  <th>Stage</th>
                  <th>Points</th>
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
                    <td className="font-semibold text-slate-900">{entry.stage}</td>
                    <td className="text-slate-600">{entry.points?.length || 0}</td>
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
          <p className="mt-3 text-sm text-slate-600">No roadmap stages match the current filters.</p>
        )}
      </section>
    </section>
  );
}
