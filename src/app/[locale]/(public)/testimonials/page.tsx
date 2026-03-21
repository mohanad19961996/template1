import { setRequestLocale } from "next-intl/server";
import { TestimonialsContent } from "./content";

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TestimonialsContent />;
}
