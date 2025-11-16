import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true, // Partial Prerendering
    reactCompiler: true,
    turbopack: {
      // Turbopack options for faster development builds
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone', // For Docker deployment
};

export default nextConfig;
