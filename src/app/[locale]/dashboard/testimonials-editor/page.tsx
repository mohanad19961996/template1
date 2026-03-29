import { setRequestLocale } from "next-intl/server";
import { TestimonialsEditorContent } from "./content";

export default async function TestimonialsEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TestimonialsEditorContent />;
}
