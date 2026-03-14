"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminRow = {
  user_id: string;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

const emptyForm = {
  user_id: "",
  email: "",
  role: "admin",
};

export default function AdminUsers() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadAdmins() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase.from("cms_admins").select("*");
      if (fetchError) throw fetchError;
      setAdmins((data as AdminRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdmins();
  }, []);

  async function addAdmin() {
    if (!form.user_id.trim()) {
      setError("User ID is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        user_id: form.user_id.trim(),
        email: form.email.trim() || null,
        role: form.role.trim() || "admin",
      };
      const { error: insertError } = await supabase.from("cms_admins").insert(payload);
      if (insertError) throw insertError;
      setForm({ ...emptyForm });
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add admin.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(userId: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_admins").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove admin.");
    }
  }

  return (
    <section className="space-y-6">
      <header className="wp-card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Users & Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Grant admin access to trusted accounts only.</p>
      </header>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Add admin</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            User ID
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.user_id}
              onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
              placeholder="UUID from auth.users"
            />
          </label>
          <label className="text-sm text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="user@email.com"
            />
          </label>
          <label className="text-sm text-slate-700">
            Role
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={addAdmin}
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add admin"}
        </button>
      </section>

      <section className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Admin list</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading admins...</p>
        ) : admins.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="wp-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.user_id}>
                    <td className="font-semibold text-slate-900">{admin.email || admin.user_id}</td>
                    <td className="text-slate-600">{admin.role || "admin"}</td>
                    <td className="text-slate-600">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td>
                      <div className="wp-actions">
                        <button
                          type="button"
                          onClick={() => removeAdmin(admin.user_id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No admins added yet.</p>
        )}
      </section>
    </section>
  );
}
