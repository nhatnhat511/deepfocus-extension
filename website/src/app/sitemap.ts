import type { MetadataRoute } from "next";
import { blogPosts } from "./blog/posts";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/pricing",
    "/blog",
    "/faq",
    "/support",
    "/contact",
    "/privacy",
    "/terms",
    "/refund",
    "/changelog",
    "/roadmap",
  ];

  const blogRoutes = blogPosts.map((post) => `/blog/${post.slug}`);

  return [...routes, ...blogRoutes].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" || path.startsWith("/blog") ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/blog") ? 0.8 : 0.7,
  }));
}
