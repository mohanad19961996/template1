import { setRequestLocale } from "next-intl/server";
import { DesignerContent } from "./content";

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DesignerContent />;
}
