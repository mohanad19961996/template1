import { setRequestLocale } from "next-intl/server";
import { HeroDashboard } from "./content";

export default async function HeroDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HeroDashboard />;
}
