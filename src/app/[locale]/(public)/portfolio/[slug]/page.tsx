import { setRequestLocale } from "next-intl/server";
import { CaseStudyContent } from "./content";

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <CaseStudyContent slug={slug} />;
}
