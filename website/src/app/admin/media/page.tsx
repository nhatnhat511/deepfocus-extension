"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const bucket = process.env.NEXT_PUBLIC_CMS_MEDIA_BUCKET || "cms-media";

type FileRow = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

export default function AdminMedia() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const { data, error: listError } = await supabase.storage.from(bucket).list("");
      if (listError) throw listError;
      setFiles((data as FileRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load media.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFiles();
  }, []);

  async function uploadFile() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      const path = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      setSelectedFile(null);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload file.");
    } finally {
      setUploading(false);
    }
  }

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function removeFile(path: string) {
    setError("");
    try {
      const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
      if (removeError) throw removeError;
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove file.");
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Media Library</h1>
        <p className="mt-2 text-sm text-slate-600">Upload logos, images, and files to Supabase Storage.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Upload new media</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={uploadFile}
            disabled={uploading || !selectedFile}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Bucket: {bucket}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Files</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading media...</p>
        ) : files.length ? (
          <div className="mt-4 space-y-3">
            {files.map((file) => {
              const url = getPublicUrl(file.name);
              return (
                <div key={file.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                    <a href={url} className="text-xs text-emerald-700 hover:underline" target="_blank" rel="noreferrer">
                      {url}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Copy URL
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No media uploaded yet.</p>
        )}
      </section>
    </section>
  );
}
