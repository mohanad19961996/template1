import { setRequestLocale } from "next-intl/server";
import { ContactEditorContent } from "./content";

export default async function ContactEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactEditorContent />;
}
