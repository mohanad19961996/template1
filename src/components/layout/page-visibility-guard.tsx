"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { EyeOff } from "lucide-react";

export function PageVisibilityGuard({ children }: { children: ReactNode }) {
  const { config, ready } = useSiteConfig();
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";

  // Don't guard until config is loaded from localStorage
  if (!ready) return <>{children}</>;

  // Map pathname to page key
  const pageKey = getPageKey(pathname);
  if (!pageKey) return <>{children}</>;

  const page = config.pages.find((p) => p.key === pageKey);
  if (page && !page.visible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: "rgba(var(--color-primary-rgb) / 0.06)",
            color: "var(--color-primary)",
          }}
        >
          <EyeOff className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold mb-1">
          {isAr ? "هذه الصفحة مخفية" : "This page is hidden"}
        </h2>
        <p className="text-sm text-foreground mb-4">
          {isAr
            ? "تم إخفاء هذه الصفحة من لوحة التحكم."
            : "This page has been hidden from the dashboard."}
        </p>
        <Link
          href="/"
          className="link-primary-hover text-sm font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          {isAr ? "العودة للرئيسية" : "Go back home"}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

function getPageKey(pathname: string): string | null {
  if (pathname === "/") return "home";
  const segment = pathname.split("/").filter(Boolean)[0];
  const map: Record<string, string> = {
    about: "about",
    services: "services",
    portfolio: "portfolio",
    contact: "contact",
  };
  return map[segment] ?? null;
}
