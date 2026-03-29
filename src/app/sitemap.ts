import type { MetadataRoute } from "next";

const BASE_URL = "https://example.com";

const pages = [
  "",
  "/about",
  "/services",
  "/portfolio",
  "/blog",
  "/contact",
  "/team",
  "/pricing",
  "/faq",
  "/testimonials",
  "/careers",
  "/gallery",
  "/designer",
];

const locales = ["ar", "en"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}
