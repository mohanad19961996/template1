import { setRequestLocale } from "next-intl/server";
import { TeamContent } from "./content";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TeamContent />;
}
