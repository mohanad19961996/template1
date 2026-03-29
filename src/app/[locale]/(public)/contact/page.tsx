import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContactContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "اتصل بنا | Template" : "Contact Us | Template",
    description: isAr
      ? "تواصل معنا اليوم - نحن هنا للإجابة على استفساراتك ومساعدتك في مشروعك القادم"
      : "Get in touch with us today - we are here to answer your questions and help with your next project",
    openGraph: {
      title: isAr ? "اتصل بنا | Template" : "Contact Us | Template",
      description: isAr
        ? "تواصل معنا اليوم - نحن هنا للإجابة على استفساراتك ومساعدتك في مشروعك القادم"
        : "Get in touch with us today - we are here to answer your questions and help with your next project",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactContent />;
}
