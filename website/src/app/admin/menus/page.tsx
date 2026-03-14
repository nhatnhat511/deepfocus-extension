"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MenuRow = {
  id: string;
  location: string;
  items: { label: string; href: string }[];
};

type MenuItem = { label: string; href: string };

const defaultLocations = [
  { key: "header", label: "Header Navigation" },
  { key: "footer", label: "Footer Navigation" },
];

const emptyMenu = {
  id: "",
  location: "header",
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
      const nextItems = prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      );
      return { ...prev, items: nextItems };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { label: "", href: "" }] }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function startEdit(menu: MenuRow) {
    setForm({
      id: menu.id,
      location: menu.location || "header",
      items: menu.items?.length ? menu.items : [{ label: "", href: "" }],
    });
  }

  function resetForm(location = "header") {
    setForm({ id: "", location, items: [{ label: "Home", href: "/" }] });
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
      const existing = menus.find((item) => item.location === form.location && item.id !== form.id);

      if (form.id) {
        const { error: updateError } = await supabase.from("cms_menus").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
      } else if (existing) {
        const { error: updateExistingError } = await supabase.from("cms_menus").update(payload).eq("id", existing.id);
        if (updateExistingError) throw updateExistingError;
      } else {
        const { error: insertError } = await supabase.from("cms_menus").insert(payload);
        if (insertError) throw insertError;
      }

      resetForm(form.location);
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

  const menuByLocation = new Map(menus.map((menu) => [menu.location, menu]));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="wp-page-title">Menus</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage header and footer navigation with dedicated menu locations, similar to WordPress Appearance &gt; Menus.
        </p>
      </header>

      {error ? (
        <section className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[360px,1fr]">
        <aside className="space-y-4">
          <section className="wp-metabox">
            <div className="wp-metabox-title">Menu Locations</div>
            <div className="wp-metabox-body space-y-3">
              {defaultLocations.map((location) => {
                const linkedMenu = menuByLocation.get(location.key);
                const active = form.location === location.key;
                return (
                  <button
                    key={location.key}
                    type="button"
                    className={`flex w-full items-center justify-between border px-3 py-3 text-left ${active ? "border-[#2271b1] bg-[#f0f6fc]" : "border-slate-200 bg-white"}`}
                    onClick={() => {
                      if (linkedMenu) {
                        startEdit(linkedMenu);
                      } else {
                        resetForm(location.key);
                      }
                    }}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{location.label}</span>
                      <span className="block text-xs text-slate-500">{location.key}</span>
                    </span>
                    <span className={`wp-pill ${linkedMenu ? "is-live" : ""}`}>{linkedMenu ? "configured" : "empty"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="wp-metabox">
            <div className="wp-metabox-title">Assigned Menus</div>
            <div className="wp-metabox-body space-y-3">
              {defaultLocations.map((location) => {
                const linkedMenu = menuByLocation.get(location.key);
                return (
                  <div key={location.key} className="border border-slate-200 px-3 py-3">
                    <div className="text-sm font-semibold text-slate-900">{location.label}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {linkedMenu ? `${linkedMenu.items.length} items assigned` : "No menu assigned"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <div className="space-y-4">
          <section className="wp-metabox">
            <div className="wp-metabox-title">Edit Menu Structure</div>
            <div className="wp-metabox-body space-y-4">
              <div className="grid gap-3 md:grid-cols-[220px,1fr]">
                <select
                  className="wp-select"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                >
                  {defaultLocations.map((location) => (
                    <option key={location.key} value={location.key}>
                      {location.label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-slate-600">
                  Each location is edited independently. Header and footer can have different link structures.
                </div>
              </div>

              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={`${form.location}-${index}`} className="border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">Menu Item {index + 1}</div>
                      <button type="button" className="wp-btn wp-btn-danger" onClick={() => removeItem(index)}>
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="wp-field"
                        placeholder="Navigation label"
                        value={item.label}
                        onChange={(e) => updateItem(index, "label", e.target.value)}
                      />
                      <input
                        className="wp-field"
                        placeholder="/pricing"
                        value={item.href}
                        onChange={(e) => updateItem(index, "href", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="wp-btn" onClick={addItem}>
                  Add Menu Item
                </button>
                <button type="button" className="wp-btn wp-btn-primary" onClick={saveMenu} disabled={saving}>
                  {saving ? "Saving..." : form.id ? "Update Menu" : "Save Menu"}
                </button>
                <button type="button" className="wp-btn" onClick={() => resetForm(form.location)}>
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="wp-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="wp-panel-title text-base">All Configured Menus</h2>
              <span className="text-xs text-slate-500">{menus.length} menus</span>
            </div>
            {loading ? (
              <p className="mt-3 text-sm text-slate-600">Loading menus...</p>
            ) : menus.length ? (
              <div className="mt-4 overflow-hidden border border-slate-200 bg-white">
                <table className="wp-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map((menu) => (
                      <tr key={menu.id}>
                        <td className="font-semibold">{menu.location}</td>
                        <td>{menu.items?.length || 0}</td>
                        <td>
                          <div className="wp-actions">
                            <button type="button" className="wp-btn" onClick={() => startEdit(menu)}>
                              Edit
                            </button>
                            <button type="button" className="wp-btn wp-btn-danger" onClick={() => deleteMenu(menu.id)}>
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
              <p className="mt-3 text-sm text-slate-600">No menus configured yet.</p>
            )}
          </section>
        </div>
      </section>
    </section>
  );
}
