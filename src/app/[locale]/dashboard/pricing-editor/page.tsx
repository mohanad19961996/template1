import { setRequestLocale } from "next-intl/server";
import { PricingEditorContent } from "./content";

export default async function PricingEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingEditorContent />;
}
