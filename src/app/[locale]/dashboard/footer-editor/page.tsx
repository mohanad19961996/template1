import { setRequestLocale } from "next-intl/server";
import { FooterEditorContent } from "./content";

export default async function FooterEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FooterEditorContent />;
}
