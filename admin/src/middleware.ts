import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// UUID pattern for embed pages - only /embed/[uuid] is public
const EMBED_UUID_PATTERN = /^\/embed\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;

  // Public auth paths
  const publicAuthPaths = ["/auth/signin", "/auth/signup", "/auth/error"];
  const isPublicAuthPath = publicAuthPaths.some((path) => pathname.startsWith(path));

  // Check if it's a valid embed page (must be /embed/[uuid] exactly)
  const isValidEmbedPath = EMBED_UUID_PATTERN.test(pathname);

  // Allow public auth paths and valid embed pages
  if (isPublicAuthPath || isValidEmbedPath) {
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
