import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "من نحن | Template" : "About Us | Template",
    description: isAr
      ? "تعرف على قصتنا ورؤيتنا وفريقنا المتميز الذي يقف وراء نجاحنا"
      : "Learn about our story, vision, and the talented team behind our success",
    openGraph: {
      title: isAr ? "من نحن | Template" : "About Us | Template",
      description: isAr
        ? "تعرف على قصتنا ورؤيتنا وفريقنا المتميز الذي يقف وراء نجاحنا"
        : "Learn about our story, vision, and the talented team behind our success",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}
