import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/auth/signin", "/auth/signup", "/auth/error"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Allow public paths (signin, signup, error)
  // Note: Don't redirect authenticated users from signin here - the token may be expired/invalid.
  // Let the client-side useUser hook handle authenticated user redirects after validating the token.
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Allow API routes (handled by backend)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect to signin if no token
  if (!token) {
    const signinUrl = new URL("/auth/signin", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
