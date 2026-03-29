import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow bypassing redirect with ?template=1
  const isTemplatePage = searchParams.get('template') === '1';

  // Redirect bare root paths to /app (unless bypassed)
  if (!isTemplatePage && (pathname === '/' || pathname === '/ar' || pathname === '/en')) {
    const locale = pathname === '/en' ? 'en' : 'ar';
    return NextResponse.redirect(new URL(`/${locale}/app`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
