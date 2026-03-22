import { setRequestLocale } from "next-intl/server";
import { DesignerEditorContent } from "./content";

export default async function DesignerEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DesignerEditorContent />;
}
