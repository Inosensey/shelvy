import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'freelancer-ln',
  project: 'shelvy-frontend',

  // Only print source map upload logs in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (slower build)
  widenClientFileUpload: true,

  // Route browser requests through your server to avoid ad blockers (adds server load)
  // tunnelRoute: '/monitoring',

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});