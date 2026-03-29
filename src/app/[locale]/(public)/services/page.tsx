import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ServicesContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "خدماتنا | Template" : "Our Services | Template",
    description: isAr
      ? "استكشف مجموعة خدماتنا المتنوعة والحلول المبتكرة التي نقدمها لعملائنا"
      : "Explore our diverse range of services and innovative solutions we offer to our clients",
    openGraph: {
      title: isAr ? "خدماتنا | Template" : "Our Services | Template",
      description: isAr
        ? "استكشف مجموعة خدماتنا المتنوعة والحلول المبتكرة التي نقدمها لعملائنا"
        : "Explore our diverse range of services and innovative solutions we offer to our clients",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServicesContent />;
}
