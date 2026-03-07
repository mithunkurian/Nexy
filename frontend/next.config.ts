import type { NextConfig } from "next";

// Stamped at build time — changes on every deployment
const buildDate = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
}); // e.g. "07 Mar 26"

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
  },
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
