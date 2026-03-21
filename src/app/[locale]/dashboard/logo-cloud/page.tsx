import { setRequestLocale } from "next-intl/server";
import { LogoCloudDashboard } from "./content";

export default async function LogoCloudDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LogoCloudDashboard />;
}
