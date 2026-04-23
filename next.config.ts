import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : 'cqgbotcjljabalonlczv.supabase.co';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  cacheComponents: true,
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['apify-client'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
    ],
  },
};

export default nextConfig;
