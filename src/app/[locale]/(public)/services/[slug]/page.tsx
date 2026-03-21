import { setRequestLocale } from "next-intl/server";
import { ServiceDetailContent } from "./content";

export function generateStaticParams() {
  return [
    { slug: "web-dev" },
    { slug: "mobile-dev" },
    { slug: "uiux" },
    { slug: "marketing" },
    { slug: "branding" },
    { slug: "consulting" },
  ];
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <ServiceDetailContent slug={slug} />;
}
