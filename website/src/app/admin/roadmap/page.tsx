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

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Roadmap</h1>
        <p className="mt-2 text-sm text-slate-600">Plan upcoming features and milestones.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Roadmap editor</h2>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Stages</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading roadmap...</p>
        ) : entries.length ? (
          <div className="mt-4 space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{entry.stage}</p>
                  <p className="text-xs text-slate-600">{entry.points?.length || 0} points</p>
                </div>
                <div className="flex gap-2">
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
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No roadmap stages yet.</p>
        )}
      </section>
    </section>
  );
}
