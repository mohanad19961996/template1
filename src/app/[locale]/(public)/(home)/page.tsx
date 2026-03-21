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
