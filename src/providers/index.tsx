"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { SiteConfigProvider } from "./site-config-provider";
import { AppStoreProvider } from "@/stores/app-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SiteConfigProvider>
        <AppStoreProvider>{children}</AppStoreProvider>
      </SiteConfigProvider>
    </ThemeProvider>
  );
}
