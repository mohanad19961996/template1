import { setRequestLocale } from "next-intl/server";
import { CareersContent } from "./content";

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CareersContent />;
}
