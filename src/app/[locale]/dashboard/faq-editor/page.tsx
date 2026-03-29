import { setRequestLocale } from "next-intl/server";
import { FaqEditorContent } from "./content";

export default async function FaqEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FaqEditorContent />;
}
