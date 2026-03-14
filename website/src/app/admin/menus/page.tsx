"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MenuRow = {
  id: string;
  location: string;
  items: { label: string; href: string }[];
};

type MenuItem = { label: string; href: string };

const emptyMenu = {
  id: "",
  location: "main",
  items: [{ label: "Home", href: "/" }],
};

export default function AdminMenus() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [form, setForm] = useState({ ...emptyMenu });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadMenus() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase.from("cms_menus").select("*");
      if (fetchError) throw fetchError;
      setMenus((data as MenuRow[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load menus.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenus();
  }, []);

  function updateItem(index: number, field: keyof MenuItem, value: string) {
    setForm((prev) => {
      const nextItems = prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...prev, items: nextItems };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { label: "", href: "" }] }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  function startEdit(menu: MenuRow) {
    setForm({
      id: menu.id,
      location: menu.location || "main",
      items: menu.items?.length ? menu.items : [{ label: "", href: "" }],
    });
  }

  function resetForm() {
    setForm({ ...emptyMenu });
  }

  async function saveMenu() {
    if (!form.location.trim()) {
      setError("Menu location is required.");
      return;
    }
    const sanitizedItems = form.items
      .map((item) => ({ label: item.label.trim(), href: item.href.trim() }))
      .filter((item) => item.label && item.href);
    if (!sanitizedItems.length) {
      setError("Add at least one menu item.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { location: form.location.trim(), items: sanitizedItems };
      if (form.id) {
        const { error: updateError } = await supabase.from("cms_menus").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("cms_menus").insert(payload);
        if (insertError) throw insertError;
      }
      resetForm();
      await loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save menu.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMenu(id: string) {
    setError("");
    try {
      const { error: deleteError } = await supabase.from("cms_menus").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete menu.");
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Menus</h1>
        <p className="mt-2 text-sm text-slate-600">Build navigation menus for header and footer.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Menu editor</h2>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <label className="mt-4 block text-sm text-slate-700">
          Menu location
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="main"
          />
        </label>
        <div className="mt-4 space-y-3">
          {form.items.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[1fr,1fr,auto]">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Label"
                value={item.label}
                onChange={(e) => updateItem(index, "label", e.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="/pricing"
                value={item.href}
                onChange={(e) => updateItem(index, "href", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Add item
        </button>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveMenu}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update menu" : "Create menu"}
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
        <h2 className="text-base font-semibold text-slate-900">Existing menus</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Loading menus...</p>
        ) : menus.length ? (
          <div className="mt-4 space-y-3">
            {menus.map((menu) => (
              <div key={menu.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{menu.location}</p>
                  <p className="text-xs text-slate-600">{menu.items?.length || 0} items</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(menu)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMenu(menu.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No menus created yet.</p>
        )}
      </section>
    </section>
  );
}
