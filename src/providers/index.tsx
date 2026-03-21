"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { SiteConfigProvider } from "./site-config-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SiteConfigProvider>{children}</SiteConfigProvider>
    </ThemeProvider>
  );
}
