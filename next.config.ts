import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
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
