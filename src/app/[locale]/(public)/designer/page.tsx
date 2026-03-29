import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DesignerContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "المصمم | Template" : "Designer | Template",
    description: isAr
      ? "استخدم أداة التصميم التفاعلية لتخصيص وتصميم موقعك حسب رغبتك"
      : "Use our interactive design tool to customize and design your website to your liking",
    openGraph: {
      title: isAr ? "المصمم | Template" : "Designer | Template",
      description: isAr
        ? "استخدم أداة التصميم التفاعلية لتخصيص وتصميم موقعك حسب رغبتك"
        : "Use our interactive design tool to customize and design your website to your liking",
    },
  };
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DesignerContent />;
}
