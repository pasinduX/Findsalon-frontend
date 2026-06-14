import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PROTECTED = ["/dashboard", "/admin", "/barber-dashboard", "/my-bookings"];

function isProtectedPath(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuth0Route(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

function hasAuth0Config() {
  return Boolean(
    process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET &&
      process.env.AUTH0_SECRET
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth0 = isAuth0Route(pathname) || isProtectedPath(pathname);

  if (!needsAuth0) {
    return NextResponse.next();
  }

  if (!hasAuth0Config()) {
    console.error("Auth0 middleware skipped: missing Auth0 environment variables");
    return isProtectedPath(pathname)
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  let res: NextResponse;
  try {
    // Let the Auth0 SDK handle its own routes, including /auth/access-token.
    res = await auth0.middleware(request);
  } catch (error) {
    console.error("Auth0 middleware failed", error);
    return isProtectedPath(pathname)
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  // Gate protected paths — redirect to Auth0 login when no session exists
  if (isProtectedPath(pathname)) {
    const session = await auth0.getSession(request).catch((error) => {
      console.error("Auth0 session lookup failed", error);
      return null;
    });
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
