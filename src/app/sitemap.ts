import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artizanmoris.octolabs.app";
  const lastModified = new Date("2026-07-02");

  const marketing = [
    { path: "", changeFrequency: "daily" as const, priority: 1 },
    { path: "/post", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/browse", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/jobs", changeFrequency: "daily" as const, priority: 0.8 },
  ];

  const account = [
    { path: "/login", changeFrequency: "weekly" as const, priority: 0.4 },
    { path: "/artisan", changeFrequency: "weekly" as const, priority: 0.4 },
  ];

  return [...marketing, ...account].map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
