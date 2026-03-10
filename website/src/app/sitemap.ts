import type { MetadataRoute } from "next";

const baseUrl = "https://deepfocustime.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/pricing",
    "/faq",
    "/support",
    "/privacy",
    "/terms",
    "/contact",
    "/refund",
    "/changelog",
    "/roadmap",
  ];

  return routes.map((path, index) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.6,
  }));
}
