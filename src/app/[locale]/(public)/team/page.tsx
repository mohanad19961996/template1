import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TeamContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "فريقنا | Template" : "Our Team | Template",
    description: isAr
      ? "تعرف على فريقنا المتميز من الخبراء والمتخصصين الذين يعملون على تحقيق رؤيتك"
      : "Meet our talented team of experts and specialists dedicated to bringing your vision to life",
    openGraph: {
      title: isAr ? "فريقنا | Template" : "Our Team | Template",
      description: isAr
        ? "تعرف على فريقنا المتميز من الخبراء والمتخصصين الذين يعملون على تحقيق رؤيتك"
        : "Meet our talented team of experts and specialists dedicated to bringing your vision to life",
    },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TeamContent />;
}
