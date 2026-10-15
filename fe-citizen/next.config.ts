import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NESTJS_API_URL:
      process.env.NESTJS_API_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;
