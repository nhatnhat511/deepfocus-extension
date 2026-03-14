"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SeoSettings = {
  site_title: string;
  meta_description: string;
  og_image_url: string;
  twitter_handle: string;
};

const emptySeo = {
  site_title: "",
  meta_description: "",
  og_image_url: "",
  twitter_handle: "",
};

export default function AdminSeo() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [seo, setSeo] = useState<SeoSettings>({ ...emptySeo });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSeo() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_site_settings")
        .select("value")
        .eq("key", "seo")
        .maybeSingle();
      if (fetchError) throw fetchError;
      const value = (data?.value as Partial<SeoSettings>) || {};
      setSeo({
        site_title: value.site_title || "",
        meta_description: value.meta_description || "",
        og_image_url: value.og_image_url || "",
        twitter_handle: value.twitter_handle || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load SEO settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSeo();
  }, []);

  async function saveSeo() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        key: "seo",
        value: {
          site_title: seo.site_title.trim(),
          meta_description: seo.meta_description.trim(),
          og_image_url: seo.og_image_url.trim(),
          twitter_handle: seo.twitter_handle.trim(),
        },
      };
      const { error: upsertError } = await supabase.from("cms_site_settings").upsert(payload, {
        onConflict: "key",
      });
      if (upsertError) throw upsertError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save SEO settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">SEO</h1>
        <p className="mt-2 text-sm text-slate-600">Set global meta titles and open graph data.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Global SEO settings</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading SEO settings...</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700 md:col-span-2">
              Site title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={seo.site_title}
                onChange={(e) => setSeo((prev) => ({ ...prev, site_title: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Meta description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                value={seo.meta_description}
                onChange={(e) => setSeo((prev) => ({ ...prev, meta_description: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Default OG image URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={seo.og_image_url}
                onChange={(e) => setSeo((prev) => ({ ...prev, og_image_url: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Twitter handle
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={seo.twitter_handle}
                onChange={(e) => setSeo((prev) => ({ ...prev, twitter_handle: e.target.value }))}
                placeholder="@deepfocustime"
              />
            </label>
          </div>
        )}
        <button
          type="button"
          onClick={saveSeo}
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save SEO"}
        </button>
      </section>
    </section>
  );
}
