import { Suspense, type ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { PageVisibilityGuard } from "@/components/layout/page-visibility-guard";
import Loading from "./loading";

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main className="min-h-screen">
        <Suspense fallback={<Loading />}>
          <PageVisibilityGuard>{children}</PageVisibilityGuard>
        </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
