import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jommrqubyihfyznalkfk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Often useful for Google auth avatars
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
