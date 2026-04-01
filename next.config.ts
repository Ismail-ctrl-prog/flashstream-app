import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/shelby/:path*",
        destination: "https://api.testnet.shelby.xyz/shelby/:path*",
      },
    ];
  },
};

export default nextConfig;
