"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const adminEmailList = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const hasAllowlist = adminEmailList.length > 0;

function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmailList.includes(String(email).toLowerCase());
}

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState("Checking admin access...");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session;
      if (!session?.user) {
        setStatus("Sign in required to access admin.");
        setSessionLoading(false);
        return;
      }

      const userEmail = session.user.email || null;
      setEmail(userEmail);

      if (hasAllowlist && isAllowedEmail(userEmail)) {
        setIsAdmin(true);
        setSessionLoading(false);
        return;
      }

      try {
        const { data: adminRow, error } = await supabase
          .from("cms_admins")
          .select("user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (error) {
          if (!hasAllowlist) {
            setStatus("Admin table not available yet. Configure cms_admins to enforce access.");
            setIsAdmin(true);
          } else {
            setStatus("Admin table not available. Configure cms_admins to enable access.");
          }
          setSessionLoading(false);
          return;
        }
        if (adminRow?.user_id) {
          setIsAdmin(true);
        } else {
          setStatus("Your account does not have admin access.");
        }
      } catch {
        setStatus("Unable to verify admin access.");
      } finally {
        setSessionLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (sessionLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Admin Access</h2>
        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-800">Admin access required</h2>
        <p className="mt-2 text-sm text-rose-700">{status}</p>
        <p className="mt-2 text-xs text-rose-700">Signed in as: {email || "unknown"}</p>
        <a
          href="/login"
          className="mt-4 inline-flex rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
        >
          Go to sign in
        </a>
      </section>
    );
  }

  return <>{children}</>;
}

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  },
  {
    href: "/admin/home",
    label: "Homepage",
    icon: "M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z",
  },
  {
    href: "/admin/pages",
    label: "Pages",
    icon: "M6 3h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 1.5V7h2.5Z",
  },
  {
    href: "/admin/posts",
    label: "Posts",
    icon: "M4 5h16v3H4V5Zm0 5h16v3H4v-3Zm0 5h10v3H4v-3Z",
  },
  {
    href: "/admin/media",
    label: "Media",
    icon: "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm3 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm-1 9 3.2-3.2a1 1 0 0 1 1.4 0L14 16l2-2 2 2v1H6Z",
  },
  {
    href: "/admin/menus",
    label: "Menus",
    icon: "M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z",
  },
  {
    href: "/admin/faq",
    label: "FAQ",
    icon: "M12 3a9 9 0 1 0 0 18h4v-4h2v6H12a11 11 0 1 1 0-22Zm0 5a3 3 0 0 0-3 3h2a1 1 0 1 1 2 1c-1.7.7-2 1.6-2 3h2c0-1 .2-1.4 1.3-2a3 3 0 0 0-1.3-5Zm-1 9h2v2h-2v-2Z",
  },
  {
    href: "/admin/changelog",
    label: "Changelog",
    icon: "M6 3h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4h10v2H7V7Zm0 4h10v2H7v-2Zm0 4h6v2H7v-2Z",
  },
  {
    href: "/admin/roadmap",
    label: "Roadmap",
    icon: "M4 5h10l2-2h4v4l-2 2v10H4V5Zm2 2v10h10V7H6Zm3 2h5v2H9V9Zm0 4h5v2H9v-2Z",
  },
  {
    href: "/admin/legal",
    label: "Legal",
    icon: "M6 2h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5Z",
  },
  {
    href: "/admin/seo",
    label: "SEO",
    icon: "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm2 5h7v2h-7V8Zm-2 4h9v2h-9v-2Zm2 4h7v2h-7v-2Z",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "M12 8a4 4 0 1 0 4 4a4 4 0 0 0-4-4Zm8 3h-1.2a7 7 0 0 0-1.3-2.5l.9-.9-1.4-1.4-.9.9A7 7 0 0 0 13 5.2V4h-2v1.2a7 7 0 0 0-2.5 1.3l-.9-.9-1.4 1.4.9.9A7 7 0 0 0 5.2 11H4v2h1.2a7 7 0 0 0 1.3 2.5l-.9.9 1.4 1.4.9-.9A7 7 0 0 0 11 18.8V20h2v-1.2a7 7 0 0 0 2.5-1.3l.9.9 1.4-1.4-.9-.9A7 7 0 0 0 18.8 13H20v-2Z",
  },
  {
    href: "/admin/users",
    label: "Users & Roles",
    icon: "M7 8a3 3 0 1 0 3-3a3 3 0 0 0-3 3Zm9 2a3 3 0 1 0-3-3a3 3 0 0 0 3 3Zm-9 2c-2.8 0-5 1.5-5 3.5V18h10v-2.5c0-2-2.2-3.5-5-3.5Zm9 1c-.4 0-.8 0-1.2.1a4.8 4.8 0 0 1 1.7 3.4V18h6v-1.5c0-2-2.2-3.5-5-3.5Z",
  },
];

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="wp-topbar">
        <div className="wp-topbar-inner">
          <div className="wp-topbar-left">
            <a href="/admin" className="wp-topbar-brand">
              DeepFocus CMS
            </a>
            <a href="/admin/pages" className="wp-topbar-link">
              + New Page
            </a>
            <a href="/admin/posts" className="wp-topbar-link">
              + New Post
            </a>
            <a href="/admin/media" className="wp-topbar-link">
              + Upload
            </a>
          </div>
          <div className="wp-topbar-right">
            <span className="wp-topbar-pill">Production</span>
            <a href="/account" className="wp-topbar-link">
              My Account
            </a>
            <a href="/" className="wp-topbar-link">
              View Site
            </a>
          </div>
        </div>
      </div>

      <div className="wp-admin-frame min-h-[80vh] rounded-3xl border border-slate-200 bg-slate-50/90 p-4 shadow-lg lg:p-6">
        <div className="mb-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Administration</p>
                <h1 className="text-xl font-semibold text-slate-900">DeepFocus Control Center</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Production</span>
                <span>CMS modules active</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Admin Status</span>
                <span>Modules ready. Public site unchanged until content is wired.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">Theme: WordPress-style</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <aside className="rounded-2xl border border-slate-900/10 bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-slate-100 shadow-lg">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">DeepFocus CMS</p>
              <h2 className="text-lg font-semibold text-white">Admin Workspace</h2>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-emerald-200">
                          <path fill="currentColor" d={item.icon} />
                        </svg>
                      </span>
                      {item.label}
                    </span>
                    {active ? <span className="text-xs text-emerald-200">Active</span> : null}
                  </a>
                );
              })}
            </nav>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              Public site remains unchanged until CMS data is wired into rendering.
            </div>
          </aside>
          <main className="space-y-6">{children}</main>
        </div>
      </div>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        .admin-shell {
          font-family: "Manrope", "Segoe UI", sans-serif;
          padding-top: 48px;
        }
        .admin-shell .wp-topbar {
          position: sticky;
          top: 0;
          z-index: 60;
          background: #0f172a;
          color: #e2e8f0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        .admin-shell .wp-topbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          font-size: 0.8rem;
        }
        .admin-shell .wp-topbar-left,
        .admin-shell .wp-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .admin-shell .wp-topbar-brand {
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #f8fafc;
        }
        .admin-shell .wp-topbar-link {
          color: #cbd5f5;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .admin-shell .wp-topbar-link:hover {
          background: rgba(148, 163, 184, 0.2);
          color: #fff;
        }
        .admin-shell .wp-topbar-pill {
          background: rgba(16, 185, 129, 0.2);
          color: #d1fae5;
          padding: 3px 8px;
          border-radius: 999px;
          font-weight: 600;
        }
        .admin-shell .wp-admin-frame {
          margin-top: 16px;
        }
        .admin-shell .wp-card {
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #fff;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        }
        .admin-shell .wp-panel-title {
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .admin-shell .wp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .admin-shell .wp-table thead th {
          text-align: left;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .admin-shell .wp-table tbody td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
        }
        .admin-shell .wp-table tbody tr:hover {
          background: #f8fafc;
        }
        .admin-shell .wp-table .wp-checkbox {
          width: 16px;
          height: 16px;
        }
        .admin-shell .wp-table .wp-actions {
          display: flex;
          gap: 8px;
        }
        .admin-shell .wp-pill {
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: #e2e8f0;
          color: #475569;
        }
        .admin-shell .wp-pill.is-live {
          background: rgba(16, 185, 129, 0.16);
          color: #047857;
        }
        .admin-shell .wp-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
        }
        .admin-shell .wp-controls .wp-bulk {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .admin-shell .wp-controls .wp-search {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .admin-shell .wp-controls .wp-group {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .admin-shell .wp-input {
          border-radius: 10px;
          border: 1px solid #cbd5f5;
          padding: 8px 10px;
          font-size: 0.85rem;
          background: #fff;
        }
        .admin-shell .wp-select {
          border-radius: 10px;
          border: 1px solid #cbd5f5;
          padding: 8px 10px;
          font-size: 0.85rem;
          background: #fff;
        }
        .admin-shell .wp-btn {
          border-radius: 10px;
          border: 1px solid #cbd5f5;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f172a;
          background: #fff;
        }
        .admin-shell .wp-btn-primary {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }
        .admin-shell .wp-pagination {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .admin-shell .wp-pagination .wp-btn {
          padding: 6px 10px;
        }
        .admin-shell .wp-muted {
          color: #94a3b8;
        }
      `}</style>
    </AdminGuard>
  );
}
