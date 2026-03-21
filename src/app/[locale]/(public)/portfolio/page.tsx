import { setRequestLocale } from "next-intl/server";
import { PortfolioContent } from "./content";

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortfolioContent />;
}
