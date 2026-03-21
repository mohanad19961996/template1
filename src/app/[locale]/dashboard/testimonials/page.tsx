import { setRequestLocale } from "next-intl/server";
import { TestimonialsDashboard } from "./content";

export default async function TestimonialsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TestimonialsDashboard />;
}
