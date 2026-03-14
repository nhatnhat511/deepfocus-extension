import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell min-h-screen">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
