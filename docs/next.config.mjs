import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Quickstarts → Integration
      {
        source: '/quickstarts/nextjs-app-router',
        destination: '/integration/nextjs',
        permanent: true
      },
      {
        source: '/quickstarts/:framework',
        destination: '/integration/:framework',
        permanent: true
      },

      // Examples → Configuration
      {
        source: '/examples/basic',
        destination: '/configuration/basic',
        permanent: true
      },
      {
        source: '/examples/validation',
        destination: '/configuration/validation',
        permanent: true
      },
      {
        source: '/examples/transformations',
        destination: '/configuration/transformations',
        permanent: true
      },
      {
        source: '/examples/:slug',
        destination: '/configuration/:slug',
        permanent: true
      },

      // Guides → Configuration or Advanced
      {
        source: '/guides/zod-schemas',
        destination: '/configuration/schemas',
        permanent: true
      },
      {
        source: '/guides/theming',
        destination: '/configuration/theming',
        permanent: true
      },
      {
        source: '/guides/ai-features',
        destination: '/advanced/ai-features',
        permanent: true
      },
      {
        source: '/guides/architecture',
        destination: '/advanced/architecture',
        permanent: true
      },
      {
        source: '/guides/:slug',
        destination: '/advanced/:slug',
        permanent: true
      },

      // Getting Started → Quick Start
      {
        source: '/getting-started',
        destination: '/quick-start/installation',
        permanent: true
      },

      // Core Concepts → Advanced
      {
        source: '/core-concepts/performance',
        destination: '/advanced/performance',
        permanent: true
      },
      {
        source: '/core-concepts/:slug',
        destination: '/advanced/:slug',
        permanent: true
      },

      // Backend → Advanced/Backend
      {
        source: '/backend/:slug*',
        destination: '/advanced/backend/:slug*',
        permanent: true
      },

      // Headless → Advanced
      {
        source: '/headless',
        destination: '/advanced/headless',
        permanent: true
      },

      // API → Reference
      {
        source: '/api',
        destination: '/reference/api',
        permanent: true
      }
    ];
  }
};

export default withMDX(config);
