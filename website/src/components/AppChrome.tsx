"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import type { PublicMenuItem } from "@/lib/cms/publicMenus";

export default function AppChrome({
  children,
  headerMenu,
  footerMenu,
}: {
  children: ReactNode;
  headerMenu: PublicMenuItem[];
  footerMenu: PublicMenuItem[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader navLinks={headerMenu} />
      <main className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-6xl px-4 py-10">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-5 text-sm text-slate-600">
          <span>&copy; {new Date().getFullYear()} DeepFocus Time</span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {footerMenu.map((item) => (
              <Link key={`${item.href}-${item.label}`} href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
