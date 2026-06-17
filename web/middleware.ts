import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "ne"];
const defaultLocale = "en";

function getPreferredLocale(request: NextRequest): string {
  // Check cookie first
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Detect Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.toLowerCase().includes("ne")) {
      return "ne";
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only perform redirection on the root path '/'
  if (pathname === "/") {
    const locale = getPreferredLocale(request);
    
    // Construct redirect URL preserving search query parameters
    const url = new URL(`/${locale}`, request.url);
    url.search = request.nextUrl.search;
    
    const response = NextResponse.redirect(url);
    
    // Set cookie to remember locale preference
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
