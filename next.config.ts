import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true, // Partial Prerendering (Next.js 16)
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone', // For Docker deployment
};

export default nextConfig;
