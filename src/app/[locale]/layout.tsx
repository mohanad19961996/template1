import type { ReactNode } from "react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { Providers } from "@/providers";
import { NavigationLoader } from "@/components/shared/navigation-loader";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Template — Digital Solutions",
  description: "Modern web template with Next.js",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isRTL = locale === "ar";
  const messages = await getMessages();

  return (
    <html lang="en" dir={isRTL ? "rtl" : "ltr"} data-locale={locale} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <NavigationLoader />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
