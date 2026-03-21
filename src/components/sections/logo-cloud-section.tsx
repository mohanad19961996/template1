"use client";

import { useLocale } from "next-intl";
import { useRef } from "react";
import { Container } from "@/components/shared/container";
import { motion, useInView } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";

export function LogoCloudSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const { config } = useSiteConfig();
  const lc = config.logoCloud;

  const marqueeLogos = [...lc.logos, ...lc.logos];
  const animationName = isAr ? "marqueeRtl" : "marqueeLtr";

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ paddingBlock: "var(--section-y-sm, 2.5rem)" }}
    >
      <Container>
        {lc.showHeading && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-[11px] text-foreground font-medium tracking-widest uppercase mb-6"
          >
            {isAr ? lc.headingAr : lc.headingEn}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative group/marquee"
        >
          {/* Edge fades */}
          <div
            className="absolute start-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--color-background), transparent)" }}
          />
          <div
            className="absolute end-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--color-background), transparent)" }}
          />

          {/* Marquee track */}
          <div className="overflow-hidden">
            <div
              className="flex items-center gap-10 group-hover/marquee:[animation-play-state:paused]"
              style={{
                animation: `${animationName} ${lc.speed}s linear infinite`,
                width: "max-content",
              }}
            >
              {marqueeLogos.map((logo, i) => (
                <div
                  key={`${logo}-${i}`}
                  className="flex items-center gap-10 shrink-0"
                >
                  <span
                    className="text-[14px] font-black tracking-[0.3em] select-none cursor-default"
                    style={{
                      color: "var(--color-foreground)",
                      opacity: 0.35,
                      transition: "opacity 0.3s ease, color 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.color = "var(--color-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.35";
                      e.currentTarget.style.color = "var(--color-foreground)";
                    }}
                  >
                    {logo}
                  </span>
                  {/* Dot separator */}
                  <span
                    className="h-1 w-1 rounded-full shrink-0"
                    style={{ background: "rgba(var(--color-primary-rgb) / 0.3)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
