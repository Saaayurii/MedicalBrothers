import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Temporarily disable for successful build, will enable after fixing prerender issues
  cacheComponents: false, // Partial Prerendering (Next.js 16)
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone', // For Docker deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
