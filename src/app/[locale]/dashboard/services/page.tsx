import { setRequestLocale } from "next-intl/server";
import { ServicesDashboard } from "./content";

export default async function ServicesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ServicesDashboard />;
}
