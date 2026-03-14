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
        ) : items.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="wp-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
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
        ) : (
          <p className="mt-3 text-sm text-slate-600">No FAQ entries yet.</p>
        )}
      </section>
    </section>
  );
}
