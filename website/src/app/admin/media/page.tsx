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
  const [search, setSearch] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("none");
  const [page, setPage] = useState(1);
  const pageSize = 12;

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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredFiles = files.filter((file) => !normalizedSearch || file.name.toLowerCase().includes(normalizedSearch));
  const pageCount = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const pagedFiles = filteredFiles.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentIds = pagedFiles.map((file) => file.name);
  const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedPaths.includes(id));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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

  async function applyBulkAction() {
    if (bulkAction !== "delete" || selectedPaths.length === 0) return;
    setError("");
    try {
      const { error: bulkError } = await supabase.storage.from(bucket).remove(selectedPaths);
      if (bulkError) throw bulkError;
      setSelectedPaths([]);
      setBulkAction("none");
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply bulk action.");
    }
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedPaths((prev) => Array.from(new Set([...prev, ...currentIds])));
    } else {
      setSelectedPaths((prev) => prev.filter((id) => !currentIds.includes(id)));
    }
  }

  return (
    <section className="space-y-6">
      <header className="wp-card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Media Library</h1>
        <p className="mt-2 text-sm text-slate-600">Upload logos, images, and files to Supabase Storage.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Upload new media</h2>
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

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Files</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading media...</p>
        ) : filteredFiles.length ? (
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
                <span className="text-xs text-slate-500">{selectedPaths.length} selected</span>
              </div>
              <div className="wp-search">
                <input
                  className="wp-input"
                  placeholder="Search media..."
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
                  <th>File</th>
                  <th>URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedFiles.map((file) => {
                  const url = getPublicUrl(file.name);
                  return (
                    <tr key={file.name}>
                      <td>
                        <input
                          type="checkbox"
                          className="wp-checkbox"
                          checked={selectedPaths.includes(file.name)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedPaths((prev) =>
                              checked ? [...prev, file.name] : prev.filter((id) => id !== file.name),
                            );
                          }}
                        />
                      </td>
                      <td className="font-semibold text-slate-900">{file.name}</td>
                      <td>
                        <a href={url} className="text-emerald-700 hover:underline" target="_blank" rel="noreferrer">
                          View
                        </a>
                      </td>
                      <td>
                        <div className="wp-actions">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredFiles.length)} of{" "}
              {filteredFiles.length}
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
          <p className="mt-3 text-sm text-slate-600">No media files match the current filters.</p>
        )}
      </section>
    </section>
  );
}
