import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/shared/auth/cookies";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (hasSession) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const fallback =
    process.env.NEXT_PUBLIC_MOCK === "1" ? "/api/mock/seed" : "/login";
  return NextResponse.redirect(new URL(fallback, request.url));
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
