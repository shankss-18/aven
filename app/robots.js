// app/robots.js — Robots meta for Next.js
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aven-store.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/account", "/orders"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
