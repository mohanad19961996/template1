import { setRequestLocale } from "next-intl/server";
import { TeamEditorContent } from "./content";

export default async function TeamEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TeamEditorContent />;
}
