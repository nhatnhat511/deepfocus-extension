import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell mx-auto max-w-6xl space-y-6">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
