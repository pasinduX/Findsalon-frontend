import type { NextConfig } from "next";

const GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:8888";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },

  // Proxy all /api/v1/* requests through the Next.js server so the browser
  // never makes a cross-origin request to the Tyk gateway. This eliminates
  // CORS entirely for local dev and avoids exposing the gateway URL client-side.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${GATEWAY_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
