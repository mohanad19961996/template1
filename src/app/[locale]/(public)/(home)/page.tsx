import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/hero-section";
import { LogoCloudSection } from "@/components/sections/logo-cloud-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { ServicesSection } from "@/components/sections/services-section";
import { StatsSection } from "@/components/sections/stats-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { CtaSection } from "@/components/sections/cta-section";
import { ProcessSection } from "@/components/sections/process-section";
import { SectionDivider } from "@/components/shared/section-divider";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr ? "الرئيسية | Template" : "Home | Template",
    description: isAr
      ? "مرحبا بكم في موقعنا - نقدم أفضل الخدمات والحلول الرقمية المتكاملة"
      : "Welcome to our website - we offer the best services and comprehensive digital solutions",
    openGraph: {
      title: isAr ? "الرئيسية | Template" : "Home | Template",
      description: isAr
        ? "مرحبا بكم في موقعنا - نقدم أفضل الخدمات والحلول الرقمية المتكاملة"
        : "Welcome to our website - we offer the best services and comprehensive digital solutions",
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <SectionDivider />
      <LogoCloudSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <ServicesSection />
      <SectionDivider />
      <StatsSection />
      <SectionDivider />
      <TestimonialsSection />
      <SectionDivider />
      <CtaSection />
      <SectionDivider />
      <ProcessSection />
    </>
  );
}
