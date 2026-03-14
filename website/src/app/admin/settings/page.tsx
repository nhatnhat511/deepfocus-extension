"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SiteSettings = {
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  support_email: string;
  footer_text: string;
  twitter_url: string;
  github_url: string;
  youtube_url: string;
};

const emptySettings = {
  logo_url: "",
  favicon_url: "",
  primary_color: "",
  support_email: "",
  footer_text: "",
  twitter_url: "",
  github_url: "",
  youtube_url: "",
};

export default function AdminSettings() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [settings, setSettings] = useState<SiteSettings>({ ...emptySettings });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("cms_site_settings")
        .select("value")
        .eq("key", "site")
        .maybeSingle();
      if (fetchError) throw fetchError;
      const value = (data?.value as Partial<SiteSettings>) || {};
      setSettings({
        logo_url: value.logo_url || "",
        favicon_url: value.favicon_url || "",
        primary_color: value.primary_color || "",
        support_email: value.support_email || "",
        footer_text: value.footer_text || "",
        twitter_url: value.twitter_url || "",
        github_url: value.github_url || "",
        youtube_url: value.youtube_url || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function saveSettings() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        key: "site",
        value: {
          logo_url: settings.logo_url.trim(),
          favicon_url: settings.favicon_url.trim(),
          primary_color: settings.primary_color.trim(),
          support_email: settings.support_email.trim(),
          footer_text: settings.footer_text.trim(),
          twitter_url: settings.twitter_url.trim(),
          github_url: settings.github_url.trim(),
          youtube_url: settings.youtube_url.trim(),
        },
      };
      const { error: upsertError } = await supabase.from("cms_site_settings").upsert(payload, {
        onConflict: "key",
      });
      if (upsertError) throw upsertError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Branding, footer, and global links.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Global settings</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading settings...</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Logo URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.logo_url}
                onChange={(e) => setSettings((prev) => ({ ...prev, logo_url: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Favicon URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.favicon_url}
                onChange={(e) => setSettings((prev) => ({ ...prev, favicon_url: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Primary color
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.primary_color}
                onChange={(e) => setSettings((prev) => ({ ...prev, primary_color: e.target.value }))}
                placeholder="#10b981"
              />
            </label>
            <label className="text-sm text-slate-700">
              Support email
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.support_email}
                onChange={(e) => setSettings((prev) => ({ ...prev, support_email: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Footer text
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.footer_text}
                onChange={(e) => setSettings((prev) => ({ ...prev, footer_text: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              Twitter URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.twitter_url}
                onChange={(e) => setSettings((prev) => ({ ...prev, twitter_url: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              GitHub URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.github_url}
                onChange={(e) => setSettings((prev) => ({ ...prev, github_url: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              YouTube URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.youtube_url}
                onChange={(e) => setSettings((prev) => ({ ...prev, youtube_url: e.target.value }))}
              />
            </label>
          </div>
        )}
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </section>
    </section>
  );
}
