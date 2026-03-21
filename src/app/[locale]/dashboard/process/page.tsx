import { setRequestLocale } from "next-intl/server";
import { ProcessDashboard } from "./content";

export default async function ProcessDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProcessDashboard />;
}
