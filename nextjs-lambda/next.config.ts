import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // This is the critical setting for containerizing Next.js.
  // It creates a minimal server, copying only the necessary
  // files for production.
  output: "standalone",
  // Configure image optimization to not use the default
  // Lambda-based optimizer, which is not compatible with
  // this setup. This is recommended if you're not using
  // a separate service for image optimization.
  images: {
    unoptimized: true,
  },

  assetPrefix: isProd ? 'https://d2klft1fbsbysq.cloudfront.net' : undefined,
};

export default nextConfig;
