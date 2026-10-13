import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  // kanjiapi.dev accepts both romanizations; keep a single canonical page for each list
  async redirects() {
    return [
      { source: "/joyo", destination: "/jouyou", permanent: true },
      { source: "/jinmeiyo", destination: "/jinmeiyou", permanent: true },
    ];
  },
};

export default nextConfig;
