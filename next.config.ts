import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Note: cacheComponents (Partial Prerendering) is disabled because
  // it's incompatible with dynamic API routes that use runtime/dynamic configs
  // (SSE streams, real-time health checks, file uploads, analytics)
  cacheComponents: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone', // For Docker deployment
};

export default nextConfig;
