import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qvrwwigdslyhmfihtbwq.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      // Add more patterns as needed
    ],
  },
};

export default nextConfig;
