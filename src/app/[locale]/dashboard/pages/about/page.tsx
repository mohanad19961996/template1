import { setRequestLocale } from "next-intl/server";
import { AboutEditorContent } from "./content";

export default async function AboutEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutEditorContent />;
}
