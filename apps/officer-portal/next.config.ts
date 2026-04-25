import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@workspace/auth',
    '@workspace/common',
    '@workspace/database',
    '@workspace/dtos',
    '@workspace/routes',
    '@workspace/ui'
  ]
};

export default nextConfig;

