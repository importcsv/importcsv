import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // All protected routes will automatically require authentication
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  }
);

// Protected routes - everything except auth pages and public routes
export const config = {
  matcher: [
    // Protect all routes except:
    // - auth pages
    // - api auth routes
    // - public landing page
    // - static files
    // - posthog analytics endpoint
    '/((?!auth|api/auth|api/public|ingest|_next/static|_next/image|favicon.ico|$).*)',
  ],
};