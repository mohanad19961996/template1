import { setRequestLocale } from "next-intl/server";
import { GalleryEditorContent } from "./content";

export default async function GalleryEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GalleryEditorContent />;
}
