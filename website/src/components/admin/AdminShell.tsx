"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
      <section className="m-8 border border-slate-300 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Admin Access</h2>
        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="m-8 border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-800">Admin access required</h2>
        <p className="mt-2 text-sm text-rose-700">{status}</p>
        <p className="mt-2 text-xs text-rose-700">Signed in as: {email || "unknown"}</p>
        <Link
          href="/login"
          className="mt-4 inline-flex border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
        >
          Go to sign in
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" },
  { href: "/admin/posts", label: "Posts", icon: "M4 5h16v3H4V5Zm0 5h16v3H4v-3Zm0 5h10v3H4v-3Z" },
  { href: "/admin/media", label: "Media", icon: "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm3 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm-1 9 3.2-3.2a1 1 0 0 1 1.4 0L14 16l2-2 2 2v1H6Z" },
  { href: "/admin/pages", label: "Pages", icon: "M6 3h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 1.5V7h2.5Z" },
  { href: "/admin/home", label: "Homepage", icon: "M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" },
  { href: "/admin/menus", label: "Menus", icon: "M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z" },
  { href: "/admin/faq", label: "FAQ", icon: "M12 3a9 9 0 1 0 0 18h4v-4h2v6H12a11 11 0 1 1 0-22Zm0 5a3 3 0 0 0-3 3h2a1 1 0 1 1 2 1c-1.7.7-2 1.6-2 3h2c0-1 .2-1.4 1.3-2a3 3 0 0 0-1.3-5Zm-1 9h2v2h-2v-2Z" },
  { href: "/admin/changelog", label: "Changelog", icon: "M6 3h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4h10v2H7V7Zm0 4h10v2H7v-2Zm0 4h6v2H7v-2Z" },
  { href: "/admin/roadmap", label: "Roadmap", icon: "M4 5h10l2-2h4v4l-2 2v10H4V5Zm2 2v10h10V7H6Zm3 2h5v2H9V9Zm0 4h5v2H9v-2Z" },
  { href: "/admin/seo", label: "SEO", icon: "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm2 5h7v2h-7V8Zm-2 4h9v2h-9v-2Zm2 4h7v2h-7v-2Z" },
  { href: "/admin/settings", label: "Settings", icon: "M12 8a4 4 0 1 0 4 4a4 4 0 0 0-4-4Zm8 3h-1.2a7 7 0 0 0-1.3-2.5l.9-.9-1.4-1.4-.9.9A7 7 0 0 0 13 5.2V4h-2v1.2a7 7 0 0 0-2.5 1.3l-.9-.9-1.4 1.4.9.9A7 7 0 0 0 5.2 11H4v2h1.2a7 7 0 0 0 1.3 2.5l-.9.9 1.4 1.4.9-.9A7 7 0 0 0 11 18.8V20h2v-1.2a7 7 0 0 0 2.5-1.3l.9.9 1.4-1.4-.9-.9A7 7 0 0 0 18.8 13H20v-2Z" },
  { href: "/admin/users", label: "Users", icon: "M7 8a3 3 0 1 0 3-3a3 3 0 0 0-3 3Zm9 2a3 3 0 1 0-3-3a3 3 0 0 0 3 3Zm-9 2c-2.8 0-5 1.5-5 3.5V18h10v-2.5c0-2-2.2-3.5-5-3.5Zm9 1c-.4 0-.8 0-1.2.1a4.8 4.8 0 0 1 1.7 3.4V18h6v-1.5c0-2-2.2-3.5-5-3.5Z" },
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
          <div className="wp-topbar-cluster">
            <Link href="/admin" className="wp-topbar-brand">
              DeepFocus CMS
            </Link>
            <Link href="/admin/posts" className="wp-topbar-link">
              + New Post
            </Link>
            <Link href="/admin/pages" className="wp-topbar-link">
              + New Page
            </Link>
            <Link href="/admin/media" className="wp-topbar-link">
              + Media
            </Link>
          </div>
          <div className="wp-topbar-cluster">
            <Link href="/admin/settings" className="wp-topbar-link">
              Screen Options
            </Link>
            <Link href="/admin/faq" className="wp-topbar-link">
              Help
            </Link>
            <Link href="/" className="wp-topbar-link">
              View Site
            </Link>
          </div>
        </div>
      </div>

      <div className="wp-admin-shell">
        <aside className="wp-sidebar">
          <div className="wp-sidebar-brand">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">DeepFocus Time</div>
            <div className="text-lg font-semibold text-white">Dashboard</div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`wp-sidebar-item ${active ? "is-active" : ""}`}>
                  <span className="wp-sidebar-item-left">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path fill="currentColor" d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </span>
                  {active ? <span className="text-[11px]">Open</span> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="wp-admin-content">{children}</main>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
        .admin-shell {
          font-family: "Manrope", "Segoe UI", sans-serif;
          background: #f0f0f1;
        }
        .admin-shell .wp-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 70;
          background: #1d2327;
          color: #f0f6fc;
          border-bottom: 1px solid #2c3338;
        }
        .admin-shell .wp-topbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 12px;
          min-height: 32px;
        }
        .admin-shell .wp-topbar-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .admin-shell .wp-topbar-brand,
        .admin-shell .wp-topbar-link {
          color: #f0f6fc;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 2px;
        }
        .admin-shell .wp-topbar-brand {
          font-weight: 700;
        }
        .admin-shell .wp-topbar-link:hover,
        .admin-shell .wp-topbar-brand:hover {
          background: #2c3338;
        }
        .admin-shell .wp-admin-shell {
          display: grid;
          grid-template-columns: 230px 1fr;
          min-height: 100vh;
          padding-top: 32px;
        }
        .admin-shell .wp-sidebar {
          background: #23282d;
          color: #f0f6fc;
          border-right: 1px solid #2c3338;
          padding: 14px 10px 22px;
        }
        .admin-shell .wp-sidebar-brand {
          padding: 8px 10px 18px;
        }
        .admin-shell .wp-sidebar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #f0f6fc;
          padding: 10px;
          border-radius: 2px;
          font-size: 13px;
          font-weight: 600;
        }
        .admin-shell .wp-sidebar-item:hover {
          background: #2c3338;
        }
        .admin-shell .wp-sidebar-item.is-active {
          background: #2271b1;
        }
        .admin-shell .wp-sidebar-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-shell .wp-admin-content {
          background: #f0f0f1;
          padding: 22px;
        }
        .admin-shell .wp-card,
        .admin-shell .wp-metabox {
          border: 1px solid #c3c4c7;
          background: #fff;
          box-shadow: none;
        }
        .admin-shell .wp-page-title {
          font-size: 1.9rem;
          line-height: 1.15;
          font-weight: 600;
          color: #1d2327;
        }
        .admin-shell .wp-panel-title {
          font-weight: 700;
          color: #1d2327;
        }
        .admin-shell .wp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .admin-shell .wp-table thead th {
          text-align: left;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #646970;
          padding: 10px 12px;
          border-bottom: 1px solid #dcdcde;
          background: #f6f7f7;
        }
        .admin-shell .wp-table tbody td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f1;
          color: #1d2327;
          vertical-align: top;
        }
        .admin-shell .wp-table tbody tr:hover {
          background: #f6f7f7;
        }
        .admin-shell .wp-table .wp-checkbox {
          width: 16px;
          height: 16px;
        }
        .admin-shell .wp-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .admin-shell .wp-pill {
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          background: #e2e8f0;
          color: #475569;
        }
        .admin-shell .wp-pill.is-live {
          background: #d1e7dd;
          color: #0f5132;
        }
        .admin-shell .wp-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
        }
        .admin-shell .wp-bulk,
        .admin-shell .wp-search,
        .admin-shell .wp-group {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .admin-shell .wp-input,
        .admin-shell .wp-select,
        .admin-shell .wp-field,
        .admin-shell .wp-textarea {
          width: 100%;
          border: 1px solid #8c8f94;
          background: #fff;
          color: #1d2327;
          padding: 8px 10px;
          font-size: 13px;
        }
        .admin-shell .wp-textarea {
          min-height: 92px;
          resize: vertical;
        }
        .admin-shell .wp-btn {
          border: 1px solid #2271b1;
          background: #f6f7f7;
          color: #2271b1;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 600;
        }
        .admin-shell .wp-btn-primary {
          background: #2271b1;
          color: #fff;
        }
        .admin-shell .wp-btn-danger {
          border-color: #b32d2e;
          color: #b32d2e;
        }
        .admin-shell .wp-pagination {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-shell .wp-muted {
          color: #646970;
        }
        .admin-shell .wp-editor {
          border: 1px solid #c3c4c7;
          background: #fff;
        }
        .admin-shell .wp-editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px;
          background: #f6f7f7;
          border-bottom: 1px solid #dcdcde;
        }
        .admin-shell .wp-editor-btn {
          border: 1px solid #c3c4c7;
          background: #fff;
          color: #1d2327;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .admin-shell .wp-editor-surface {
          min-height: 480px;
          padding: 18px;
          font-size: 15px;
          line-height: 1.7;
          color: #1d2327;
          outline: none;
        }
        .admin-shell .wp-editor-surface:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
        }
        .admin-shell .wp-metabox-title {
          padding: 10px 12px;
          background: #f6f7f7;
          border-bottom: 1px solid #dcdcde;
          font-size: 13px;
          font-weight: 700;
          color: #1d2327;
        }
        .admin-shell .wp-metabox-body {
          padding: 12px;
        }
        @media (max-width: 1024px) {
          .admin-shell .wp-admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-shell .wp-sidebar {
            border-right: 0;
            border-bottom: 1px solid #2c3338;
          }
        }
      `}</style>
    </AdminGuard>
  );
}
