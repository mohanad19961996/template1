import { setRequestLocale } from "next-intl/server";
import { BlogEditorContent } from "./content";

export default async function BlogEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BlogEditorContent />;
}
