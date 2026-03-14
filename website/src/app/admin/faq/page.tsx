"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number | null;
  is_published: boolean | null;
};

const emptyForm = {
  id: "",
  question: "",
  answer: "",
  sort_order: 0,
  is_published: true,
};

export default function AdminFaq() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<FaqRow[]>([]);
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

  async function loadFaq() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_faq")
        .select("*")
        .order("sort_order", { ascending: true });
      if (fetchError) throw fetchError;
      setItems((data as FaqRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load FAQ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFaq();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.question?.toLowerCase().includes(normalizedSearch) ||
      item.answer?.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && item.is_published) ||
      (statusFilter === "hidden" && !item.is_published);
    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedItems = filteredItems.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentIds = pagedItems.map((item) => item.id);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function startEdit(item: FaqRow) {
    setForm({
      id: item.id,
      question: item.question || "",
      answer: item.answer || "",
      sort_order: item.sort_order ?? 0,
      is_published: item.is_published ?? true,
    });
  }

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function saveFaq() {
    if (!form.question.trim() || !form.answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_published: !!form.is_published,
      };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_faq").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_faq").insert(payload);
        if (insertError) throw insertError;
      }
      resetForm();
      await loadFaq();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save FAQ.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFaq(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_faq").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadFaq();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete FAQ.");
    }
  }

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.from("cms_faq").delete().in("id", selectedIds);
      if (bulkError) throw bulkError;
      setSelectedIds([]);
      setBulkAction("none");
      await loadFaq();
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
        <h1 className="text-2xl font-semibold text-slate-900">FAQ</h1>
        <p className="mt-2 text-sm text-slate-600">Manage frequently asked questions.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">FAQ editor</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700 md:col-span-2">
            Question
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Answer
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              value={form.answer}
              onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveFaq}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update FAQ" : "Create FAQ"}
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
        <h2 className="wp-panel-title text-base text-slate-900">FAQ list</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading FAQ...</p>
        ) : filteredItems.length ? (
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
                  placeholder="Search FAQ..."
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
                  <th>Question</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
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
                    <td className="font-semibold text-slate-900">{item.question}</td>
                    <td className="text-slate-600">{item.sort_order ?? 0}</td>
                    <td>
                      <span className={`wp-pill ${item.is_published ? "is-live" : ""}`}>
                        {item.is_published ? "published" : "hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="wp-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFaq(item.id)}
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
              Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredItems.length)} of{" "}
              {filteredItems.length}
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
          <p className="mt-3 text-sm text-slate-600">No FAQ entries match the current filters.</p>
        )}
      </section>
    </section>
  );
}
