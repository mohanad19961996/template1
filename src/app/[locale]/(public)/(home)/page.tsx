import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionDivider } from "@/components/shared/section-divider";

const LogoCloudSection = dynamic(() => import("@/components/sections/logo-cloud-section").then(m => ({ default: m.LogoCloudSection })), { ssr: true });
const FeaturesSection = dynamic(() => import("@/components/sections/features-section").then(m => ({ default: m.FeaturesSection })), { ssr: true });
const ServicesSection = dynamic(() => import("@/components/sections/services-section").then(m => ({ default: m.ServicesSection })), { ssr: true });
const StatsSection = dynamic(() => import("@/components/sections/stats-section").then(m => ({ default: m.StatsSection })), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/sections/testimonials-section").then(m => ({ default: m.TestimonialsSection })), { ssr: true });
const CtaSection = dynamic(() => import("@/components/sections/cta-section").then(m => ({ default: m.CtaSection })), { ssr: true });
const ProcessSection = dynamic(() => import("@/components/sections/process-section").then(m => ({ default: m.ProcessSection })), { ssr: true });

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
