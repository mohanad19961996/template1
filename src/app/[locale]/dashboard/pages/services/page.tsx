import { setRequestLocale } from "next-intl/server";
import { ServicesEditorContent } from "./content";

export default async function ServicesEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServicesEditorContent />;
}
