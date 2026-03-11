import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/pricing",
    "/faq",
    "/support",
    "/contact",
    "/privacy",
    "/terms",
    "/refund",
    "/changelog",
    "/roadmap",
  ];

  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
