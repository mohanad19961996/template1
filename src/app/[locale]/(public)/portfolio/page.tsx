import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PortfolioContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "أعمالنا | Template" : "Portfolio | Template",
    description: isAr
      ? "تصفح معرض أعمالنا واطلع على المشاريع الناجحة التي أنجزناها لعملائنا"
      : "Browse our portfolio and see the successful projects we have delivered for our clients",
    openGraph: {
      title: isAr ? "أعمالنا | Template" : "Portfolio | Template",
      description: isAr
        ? "تصفح معرض أعمالنا واطلع على المشاريع الناجحة التي أنجزناها لعملائنا"
        : "Browse our portfolio and see the successful projects we have delivered for our clients",
    },
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortfolioContent />;
}
