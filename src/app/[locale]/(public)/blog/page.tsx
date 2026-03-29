import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BlogContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "المدونة | Template" : "Blog | Template",
    description: isAr
      ? "اقرأ أحدث المقالات والأخبار والنصائح في مجالات التقنية والأعمال"
      : "Read our latest articles, news, and tips on technology and business",
    openGraph: {
      title: isAr ? "المدونة | Template" : "Blog | Template",
      description: isAr
        ? "اقرأ أحدث المقالات والأخبار والنصائح في مجالات التقنية والأعمال"
        : "Read our latest articles, news, and tips on technology and business",
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BlogContent />;
}
