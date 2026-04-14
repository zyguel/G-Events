import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Dev + tunnel (ngrok, etc.): browser Origin is the public hostname, not localhost.
  // Next.js otherwise blocks /_next and RSC requests → client JS fails to run → no validation UI, OAuth clicks seem dead.
  ...(isDev
    ? {
        allowedDevOrigins: [
          "*.ngrok-free.app",
          "*.ngrok.io",
          "*.ngrok.app",
          "*.trycloudflare.com",
        ],
      }
    : {}),
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
