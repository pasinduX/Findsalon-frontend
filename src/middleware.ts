import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PROTECTED = ["/dashboard", "/admin", "/barber-dashboard", "/my-bookings"];

export async function middleware(request: NextRequest) {
  // Let the Auth0 SDK handle its own routes (/auth/login, /auth/logout, /auth/callback, /auth/profile)
  const res = await auth0.middleware(request);

  const { pathname } = request.nextUrl;

  // Gate protected paths — redirect to Auth0 login when no session exists
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const session = await auth0.getSession(request);
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
