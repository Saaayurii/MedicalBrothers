import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true, // Partial Prerendering
    reactCompiler: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone', // For Docker deployment
};

export default nextConfig;
