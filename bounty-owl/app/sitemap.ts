import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/db/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bountyowl.com";

const CATEGORIES = [
  "novel", "illustration", "programming", "ai", "photography",
  "video", "design", "startup", "research", "scholarship",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: contests } = await supabaseAdmin
    .from("contests")
    .select("id, updated_at")
    .eq("status", "active")
    .limit(1000);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...CATEGORIES.map((cat) => ({
      url: `${BASE_URL}/contest/${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];

  const contestPages: MetadataRoute.Sitemap = (contests ?? []).map((contest) => ({
    url: `${BASE_URL}/dashboard/contests/${contest.id}`,
    lastModified: new Date(contest.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...contestPages];
}
