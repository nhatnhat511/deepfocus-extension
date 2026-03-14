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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("none");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredSections = sections.filter((section) => {
    const matchesSearch =
      !normalizedSearch ||
      section.title?.toLowerCase().includes(normalizedSearch) ||
      section.key?.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enabled" && section.is_enabled) ||
      (statusFilter === "hidden" && !section.is_enabled);
    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredSections.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedSections = filteredSections.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentIds = pagedSections.map((section) => section.id);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedIds.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.from("cms_home_sections").delete().in("id", selectedIds);
      if (bulkError) throw bulkError;
      setSelectedIds([]);
      setBulkAction("none");
      await loadSections();
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
        <h1 className="text-2xl font-semibold text-slate-900">Homepage Builder</h1>
        <p className="mt-2 text-sm text-slate-600">Define hero, feature blocks, and CTAs for the homepage.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Section editor</h2>
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

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Existing sections</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading sections...</p>
        ) : filteredSections.length ? (
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
                  <option value="enabled">Enabled</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div className="wp-search">
                <input
                  className="wp-input"
                  placeholder="Search sections..."
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
                  <th>Section</th>
                  <th>Key</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedSections.map((section) => (
                  <tr key={section.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="wp-checkbox"
                        checked={selectedIds.includes(section.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedIds((prev) =>
                            checked ? [...prev, section.id] : prev.filter((id) => id !== section.id),
                          );
                        }}
                      />
                    </td>
                    <td className="font-semibold text-slate-900">{section.title || section.key}</td>
                    <td className="text-slate-600">{section.key}</td>
                    <td className="text-slate-600">{section.sort_order ?? 0}</td>
                    <td>
                      <span className={`wp-pill ${section.is_enabled ? "is-live" : ""}`}>
                        {section.is_enabled ? "enabled" : "hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="wp-actions">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredSections.length)} of{" "}
              {filteredSections.length}
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
          <p className="mt-3 text-sm text-slate-600">No sections match the current filters.</p>
        )}
      </section>
    </section>
  );
}
