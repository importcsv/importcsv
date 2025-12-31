import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Old Quick Start → New Getting Started
      {
        source: '/quick-start/installation',
        destination: '/getting-started',
        permanent: true
      },
      {
        source: '/quick-start/introduction',
        destination: '/getting-started',
        permanent: true
      },
      {
        source: '/quick-start/:slug*',
        destination: '/getting-started',
        permanent: true
      },

      // Old Integration → New Getting Started
      {
        source: '/integration/nextjs',
        destination: '/getting-started/nextjs',
        permanent: true
      },
      {
        source: '/integration/react',
        destination: '/getting-started/react',
        permanent: true
      },
      {
        source: '/integration/handling-data',
        destination: '/getting-started/handling-data',
        permanent: true
      },
      {
        source: '/integration/deployment',
        destination: '/getting-started',
        permanent: true
      },
      {
        source: '/integration/preact',
        destination: '/getting-started/react',
        permanent: true
      },
      {
        source: '/integration/:slug*',
        destination: '/getting-started',
        permanent: true
      },

      // Quickstarts → Getting Started
      {
        source: '/quickstarts/nextjs-app-router',
        destination: '/getting-started/nextjs',
        permanent: true
      },
      {
        source: '/quickstarts/nextjs',
        destination: '/getting-started/nextjs',
        permanent: true
      },
      {
        source: '/quickstarts/react',
        destination: '/getting-started/react',
        permanent: true
      },
      {
        source: '/quickstarts/:framework',
        destination: '/getting-started',
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

      // Core Concepts → Advanced
      {
        source: '/core-concepts/performance',
        destination: '/advanced/handling-large-files',
        permanent: true
      },
      {
        source: '/advanced/performance',
        destination: '/advanced/handling-large-files',
        permanent: true
      },
      {
        source: '/core-concepts/:slug',
        destination: '/advanced/:slug',
        permanent: true
      },

      // Backend → Self-Hosting
      {
        source: '/backend/:slug*',
        destination: '/self-hosting/:slug*',
        permanent: true
      },
      {
        source: '/advanced/backend',
        destination: '/self-hosting',
        permanent: true
      },
      {
        source: '/advanced/backend/:slug*',
        destination: '/self-hosting/:slug*',
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
