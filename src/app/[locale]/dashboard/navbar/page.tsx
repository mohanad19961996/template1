import { setRequestLocale } from "next-intl/server";
import { NavbarDashboard } from "./content";

export default async function NavbarDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NavbarDashboard />;
}
