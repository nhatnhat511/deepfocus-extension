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
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/home", label: "Homepage" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/menus", label: "Menus" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/changelog", label: "Changelog" },
  { href: "/admin/roadmap", label: "Roadmap" },
  { href: "/admin/legal", label: "Legal" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users & Roles" },
];

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
            <h2 className="text-lg font-semibold text-slate-900">DeepFocus CMS</h2>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
                    active
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.label}</span>
                  {active ? <span className="text-xs text-emerald-700">Active</span> : null}
                </a>
              );
            })}
          </nav>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            This admin is isolated from the public site. Connect content rendering when ready.
          </div>
        </aside>
        <main className="space-y-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
