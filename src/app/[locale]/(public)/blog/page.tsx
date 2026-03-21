import { setRequestLocale } from "next-intl/server";
import { BlogContent } from "./content";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BlogContent />;
}
