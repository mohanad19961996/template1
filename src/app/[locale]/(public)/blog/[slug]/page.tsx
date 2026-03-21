import { setRequestLocale } from "next-intl/server";
import { ArticleContent } from "./content";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <ArticleContent slug={slug} />;
}
