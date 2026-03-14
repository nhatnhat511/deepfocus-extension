export const metadata = {
  title: "Admin Dashboard",
  description: "DeepFocus Time admin dashboard.",
};

const quickLinks = [
  { label: "Edit Homepage", href: "/admin/home", desc: "Hero, sections, CTAs." },
  { label: "Manage Pages", href: "/admin/pages", desc: "Static pages and SEO." },
  { label: "Write Posts", href: "/admin/posts", desc: "Blog and updates." },
  { label: "Media Library", href: "/admin/media", desc: "Upload logos and images." },
  { label: "FAQ", href: "/admin/faq", desc: "Common customer questions." },
  { label: "Settings", href: "/admin/settings", desc: "Brand, footer, links." },
];

export default function AdminDashboard() {
  return (
    <section className="space-y-6">
      <header className="wp-card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage homepage, content, and global settings. Public site is unchanged until you wire rendering to CMS data.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="wp-card p-5 hover:border-emerald-300"
          >
            <h2 className="text-base font-semibold text-slate-900">{item.label}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </a>
        ))}
      </div>

      <div className="wp-card p-6">
        <h2 className="wp-panel-title text-base text-slate-900">Setup checklist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Create CMS tables with the provided SQL script.</li>
          <li>Add at least one admin user in the cms_admins table.</li>
          <li>Create the Supabase Storage bucket for media uploads.</li>
          <li>Decide when to wire public pages to CMS data.</li>
        </ul>
      </div>
    </section>
  );
}
