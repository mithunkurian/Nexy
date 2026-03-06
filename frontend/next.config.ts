import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Firebase Hosting
  output: "export",

  // All API calls go directly to the backend URL at runtime
  // (no server-side rewrites when statically exported)
  // Set NEXT_PUBLIC_API_URL + NEXT_PUBLIC_WS_URL at build time
  // or via Firebase environment config.

  images: {
    unoptimized: true, // required for static export
  },

  trailingSlash: true, // Firebase Hosting friendly URLs
};

export default nextConfig;
