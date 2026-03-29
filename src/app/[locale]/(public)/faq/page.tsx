import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FaqContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "الأسئلة الشائعة | Template" : "FAQ | Template",
    description: isAr
      ? "إجابات على الأسئلة الأكثر شيوعا حول خدماتنا ومنتجاتنا وطريقة العمل معنا"
      : "Answers to frequently asked questions about our services, products, and how we work",
    openGraph: {
      title: isAr ? "الأسئلة الشائعة | Template" : "FAQ | Template",
      description: isAr
        ? "إجابات على الأسئلة الأكثر شيوعا حول خدماتنا ومنتجاتنا وطريقة العمل معنا"
        : "Answers to frequently asked questions about our services, products, and how we work",
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FaqContent />;
}
