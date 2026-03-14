"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LegalForm = {
  id: string;
  title: string;
  content: string;
};

const emptyForm = {
  id: "",
  title: "",
  content: "",
};

async function fetchPage(supabase: ReturnType<typeof createSupabaseBrowserClient>, slug: string) {
  const { data, error } = await supabase.from("cms_pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as { id: string; title: string; content: string | null } | null;
}

export default function AdminLegal() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [privacy, setPrivacy] = useState<LegalForm>({ ...emptyForm });
  const [terms, setTerms] = useState<LegalForm>({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadLegal() {
    setLoading(true);
    setError("");
    try {
      const privacyPage = await fetchPage(supabase, "privacy");
      const termsPage = await fetchPage(supabase, "terms");
      if (privacyPage) {
        setPrivacy({
          id: privacyPage.id,
          title: privacyPage.title || "Privacy Policy",
          content: privacyPage.content || "",
        });
      }
      if (termsPage) {
        setTerms({
          id: termsPage.id,
          title: termsPage.title || "Terms of Service",
          content: termsPage.content || "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load legal pages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLegal();
  }, []);

  async function saveLegal(slug: string, form: LegalForm) {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        slug,
        title: form.title.trim(),
        content: form.content.trim() || null,
        status: "published",
      };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_pages").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_pages").insert(payload);
        if (insertError) throw insertError;
      }
      await loadLegal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save legal page.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Legal</h1>
        <p className="mt-2 text-sm text-slate-600">Edit Privacy Policy and Terms of Service content.</p>
      </header>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading legal pages...</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Privacy Policy</h2>
            <label className="mt-4 block text-sm text-slate-700">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={privacy.title}
                onChange={(e) => setPrivacy((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <label className="mt-4 block text-sm text-slate-700">
              Content
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={8}
                value={privacy.content}
                onChange={(e) => setPrivacy((prev) => ({ ...prev, content: e.target.value }))}
              />
            </label>
            <button
              type="button"
              onClick={() => saveLegal("privacy", privacy)}
              disabled={saving}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Privacy"}
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Terms of Service</h2>
            <label className="mt-4 block text-sm text-slate-700">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={terms.title}
                onChange={(e) => setTerms((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <label className="mt-4 block text-sm text-slate-700">
              Content
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={8}
                value={terms.content}
                onChange={(e) => setTerms((prev) => ({ ...prev, content: e.target.value }))}
              />
            </label>
            <button
              type="button"
              onClick={() => saveLegal("terms", terms)}
              disabled={saving}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Terms"}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
