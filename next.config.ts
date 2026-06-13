import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["remotion", "@remotion/player"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org", pathname: "/**" },
      { protocol: "https", hostname: "books.google.com", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/weight", destination: "/body", permanent: true },
      { source: "/training", destination: "/workouts", permanent: true },
      { source: "/analysis", destination: "/analytics", permanent: true },
      { source: "/review", destination: "/reviews", permanent: true },
      { source: "/identity", destination: "/dashboard", permanent: false },
      { source: "/timeblock", destination: "/planner", permanent: true },
      { source: "/pomodoro", destination: "/planner", permanent: true },
    ];
  },
};

export default nextConfig;
