"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  DEFAULT_CONFIG, DEFAULT_NAVBAR, DEFAULT_HERO, DEFAULT_HERO_CONTENT,
  DEFAULT_LOGO_CLOUD, DEFAULT_FEATURES, DEFAULT_SERVICES, DEFAULT_STATS,
  DEFAULT_TESTIMONIALS, DEFAULT_CTA, DEFAULT_PROCESS,
  STORAGE_KEY,
  type SiteConfig, type PageConfig, type NavbarConfig, type HeroConfig, type HeroContent,
  type LogoCloudConfig, type FeaturesConfig, type ServicesConfig, type StatsConfig,
  type TestimonialsConfig, type CtaConfig, type ProcessConfig,
} from "@/lib/site-config";

interface SiteConfigContextValue {
  config: SiteConfig;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  updatePage: (key: string, updates: Partial<Pick<PageConfig, "visible" | "inNavbar">>) => void;
  updateNavbar: (partial: Partial<NavbarConfig>) => void;
  updateHero: (partial: Partial<HeroConfig>) => void;
  updateHeroContent: (partial: Partial<HeroContent>) => void;
  updateLogoCloud: (partial: Partial<LogoCloudConfig>) => void;
  updateFeatures: (partial: Partial<FeaturesConfig>) => void;
  updateServices: (partial: Partial<ServicesConfig>) => void;
  updateStats: (partial: Partial<StatsConfig>) => void;
  updateTestimonials: (partial: Partial<TestimonialsConfig>) => void;
  updateCta: (partial: Partial<CtaConfig>) => void;
  updateProcess: (partial: Partial<ProcessConfig>) => void;
  resetConfig: () => void;
  ready: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  updatePage: () => {},
  updateNavbar: () => {},
  updateHero: () => {},
  updateHeroContent: () => {},
  updateLogoCloud: () => {},
  updateFeatures: () => {},
  updateServices: () => {},
  updateStats: () => {},
  updateTestimonials: () => {},
  updateCta: () => {},
  updateProcess: () => {},
  resetConfig: () => {},
  ready: false,
});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new pages added later
        const mergedPages = DEFAULT_CONFIG.pages.map((defaultPage) => {
          const storedPage = parsed.pages?.find((p: PageConfig) => p.key === defaultPage.key);
          return storedPage
            ? { ...defaultPage, visible: storedPage.visible, inNavbar: storedPage.inNavbar }
            : defaultPage;
        });
        const mergedNavbar: NavbarConfig = {
          ...DEFAULT_NAVBAR,
          ...(parsed.navbar ?? {}),
        };
        const mergedHero: HeroConfig = {
          ...DEFAULT_HERO,
          ...(parsed.hero ?? {}),
          content: {
            ...DEFAULT_HERO_CONTENT,
            ...(parsed.hero?.content ?? {}),
          },
        };
        // Migration: if old heroVariant exists but no hero object, use it
        if (!parsed.hero && parsed.heroVariant) {
          mergedHero.variant = parsed.heroVariant;
        }
        setConfig({
          pages: mergedPages,
          hero: mergedHero,
          footerVariant: parsed.footerVariant ?? DEFAULT_CONFIG.footerVariant,
          navbar: mergedNavbar,
          logoCloud: { ...DEFAULT_LOGO_CLOUD, ...(parsed.logoCloud ?? {}) },
          features: { ...DEFAULT_FEATURES, ...(parsed.features ?? {}) },
          services: { ...DEFAULT_SERVICES, ...(parsed.services ?? {}) },
          stats: { ...DEFAULT_STATS, ...(parsed.stats ?? {}) },
          testimonials: { ...DEFAULT_TESTIMONIALS, ...(parsed.testimonials ?? {}) },
          cta: { ...DEFAULT_CTA, ...(parsed.cta ?? {}) },
          process: { ...DEFAULT_PROCESS, ...(parsed.process ?? {}) },
        });
      }
    } catch {
      // Invalid stored data — use defaults
    }
    setReady(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config, ready]);

  const updateConfig = useCallback((partial: Partial<SiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const updatePage = useCallback(
    (key: string, updates: Partial<Pick<PageConfig, "visible" | "inNavbar">>) => {
      setConfig((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.key === key ? { ...p, ...updates } : p)),
      }));
    },
    []
  );

  const updateNavbar = useCallback((partial: Partial<NavbarConfig>) => {
    setConfig((prev) => ({
      ...prev,
      navbar: { ...prev.navbar, ...partial },
    }));
  }, []);

  const updateHero = useCallback((partial: Partial<HeroConfig>) => {
    setConfig((prev) => ({
      ...prev,
      hero: { ...prev.hero, ...partial },
    }));
  }, []);

  const updateHeroContent = useCallback((partial: Partial<HeroContent>) => {
    setConfig((prev) => ({
      ...prev,
      hero: { ...prev.hero, content: { ...prev.hero.content, ...partial } },
    }));
  }, []);

  const updateLogoCloud = useCallback((partial: Partial<LogoCloudConfig>) => {
    setConfig((prev) => ({ ...prev, logoCloud: { ...prev.logoCloud, ...partial } }));
  }, []);

  const updateFeatures = useCallback((partial: Partial<FeaturesConfig>) => {
    setConfig((prev) => ({ ...prev, features: { ...prev.features, ...partial } }));
  }, []);

  const updateServices = useCallback((partial: Partial<ServicesConfig>) => {
    setConfig((prev) => ({ ...prev, services: { ...prev.services, ...partial } }));
  }, []);

  const updateStats = useCallback((partial: Partial<StatsConfig>) => {
    setConfig((prev) => ({ ...prev, stats: { ...prev.stats, ...partial } }));
  }, []);

  const updateTestimonials = useCallback((partial: Partial<TestimonialsConfig>) => {
    setConfig((prev) => ({ ...prev, testimonials: { ...prev.testimonials, ...partial } }));
  }, []);

  const updateCta = useCallback((partial: Partial<CtaConfig>) => {
    setConfig((prev) => ({ ...prev, cta: { ...prev.cta, ...partial } }));
  }, []);

  const updateProcess = useCallback((partial: Partial<ProcessConfig>) => {
    setConfig((prev) => ({ ...prev, process: { ...prev.process, ...partial } }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, updateConfig, updatePage, updateNavbar, updateHero, updateHeroContent, updateLogoCloud, updateFeatures, updateServices, updateStats, updateTestimonials, updateCta, updateProcess, resetConfig, ready }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
