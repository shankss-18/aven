// app/sitemap.js — Auto-generated sitemap for Vercel/Next.js
import db from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aven-store.vercel.app";

export default async function sitemap() {
  // Static pages
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/auth`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic product pages
  let productPages = [];
  try {
    const res = await db.execute("SELECT id, updated_at FROM products WHERE is_active = 1 OR is_active IS NULL");
    productPages = res.rows.map((p) => ({
      url: `${BASE_URL}/products/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // DB unavailable during build — skip product pages
  }

  return [...staticPages, ...productPages];
}
