import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CareersContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "الوظائف | Template" : "Careers | Template",
    description: isAr
      ? "انضم إلى فريقنا - اكتشف فرص العمل المتاحة وابدأ مسيرتك المهنية معنا"
      : "Join our team - discover available job opportunities and start your career with us",
    openGraph: {
      title: isAr ? "الوظائف | Template" : "Careers | Template",
      description: isAr
        ? "انضم إلى فريقنا - اكتشف فرص العمل المتاحة وابدأ مسيرتك المهنية معنا"
        : "Join our team - discover available job opportunities and start your career with us",
    },
  };
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CareersContent />;
}
