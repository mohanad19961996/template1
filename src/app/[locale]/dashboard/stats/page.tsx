import { setRequestLocale } from "next-intl/server";
import { StatsDashboard } from "./content";

export default async function StatsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StatsDashboard />;
}
