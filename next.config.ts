import type { NextConfig } from "next";
import path from "node:path";

// Optional loader if you’re using custom visual edit tagging
const LOADER = path.resolve(__dirname, "src/visual-edits/component-tagger-loader.js");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // Root path for output tracing
  outputFileTracingRoot: path.resolve(__dirname, "../../"),

  // TypeScript strict checking — set to true to block builds on TS errors
  typescript: {
    ignoreBuildErrors: false,
  },

  // Modern Turbopack rule example (if you use custom loaders)
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER],
      },
    },
  },

  // No experimental or deprecated config keys
  experimental: {},
};

export default nextConfig;
