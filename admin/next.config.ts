import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Security headers
  async headers() {
    return [
      {
        // Apply X-Frame-Options DENY to all routes except /embed
        // This prevents clickjacking attacks on dashboard pages
        source: "/((?!embed).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
        ],
      },
      {
        // Embed routes can be framed, but we rely on origin validation
        // in the page component for postMessage security.
        // We allow any origin to frame the embed page since the actual
        // security is enforced via the required 'origin' query parameter
        // which controls where postMessage data is sent.
        source: "/embed/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          // Note: frame-ancestors is not set here to allow embedding
          // The origin parameter validation provides the security layer
        ],
      },
    ];
  },
};

export default nextConfig;
