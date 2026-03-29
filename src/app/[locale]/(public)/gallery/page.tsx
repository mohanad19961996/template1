import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { GalleryContent } from "./content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "معرض الصور | Template" : "Gallery | Template",
    description: isAr
      ? "استعرض معرض الصور الخاص بنا واطلع على أبرز أعمالنا وإنجازاتنا المصورة"
      : "Browse our photo gallery and see highlights of our work and visual achievements",
    openGraph: {
      title: isAr ? "معرض الصور | Template" : "Gallery | Template",
      description: isAr
        ? "استعرض معرض الصور الخاص بنا واطلع على أبرز أعمالنا وإنجازاتنا المصورة"
        : "Browse our photo gallery and see highlights of our work and visual achievements",
    },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GalleryContent />;
}
