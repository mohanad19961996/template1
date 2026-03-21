import { setRequestLocale } from "next-intl/server";
import { CtaDashboard } from "./content";

export default async function CtaDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CtaDashboard />;
}
