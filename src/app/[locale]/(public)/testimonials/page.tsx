import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TestimonialsContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "آراء العملاء | Template" : "Testimonials | Template",
    description: isAr
      ? "اطلع على آراء وتجارب عملائنا الذين وثقوا بنا وحققنا لهم نتائج استثنائية"
      : "Read what our clients say about their experience working with us and the results we delivered",
    openGraph: {
      title: isAr ? "آراء العملاء | Template" : "Testimonials | Template",
      description: isAr
        ? "اطلع على آراء وتجارب عملائنا الذين وثقوا بنا وحققنا لهم نتائج استثنائية"
        : "Read what our clients say about their experience working with us and the results we delivered",
    },
  };
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TestimonialsContent />;
}
