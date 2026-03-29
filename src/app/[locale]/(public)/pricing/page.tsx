import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PricingContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "الأسعار | Template" : "Pricing | Template",
    description: isAr
      ? "اطلع على خطط الأسعار المرنة والباقات المتنوعة التي تناسب احتياجاتك وميزانيتك"
      : "View our flexible pricing plans and packages designed to fit your needs and budget",
    openGraph: {
      title: isAr ? "الأسعار | Template" : "Pricing | Template",
      description: isAr
        ? "اطلع على خطط الأسعار المرنة والباقات المتنوعة التي تناسب احتياجاتك وميزانيتك"
        : "View our flexible pricing plans and packages designed to fit your needs and budget",
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingContent />;
}
