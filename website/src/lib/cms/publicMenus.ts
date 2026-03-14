export type PublicMenuItem = {
  href: string;
  label: string;
};

export const defaultHeaderMenu: PublicMenuItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export const defaultFooterMenu: PublicMenuItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund" },
  { href: "/support", label: "Support" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

export function sanitizeMenu(items: PublicMenuItem[] | null | undefined, fallback: PublicMenuItem[]) {
  const cleaned = (items || []).filter((item) => item?.href?.trim() && item?.label?.trim());
  return cleaned.length ? cleaned : fallback;
}
