import { setRequestLocale } from "next-intl/server";
import { StatsEditorContent } from "./content";

export default async function StatsEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StatsEditorContent />;
}
