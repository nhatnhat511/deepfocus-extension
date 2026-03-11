import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/auth", "/checkout", "/login", "/signup", "/forgot-password", "/update-password"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
