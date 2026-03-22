import { setRequestLocale } from "next-intl/server";
import { PortfolioEditorContent } from "./content";

export default async function PortfolioEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortfolioEditorContent />;
}
