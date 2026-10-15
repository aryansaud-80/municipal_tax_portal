import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Render Static Sites: emits a fully static `out/` directory.
  // There is no Next.js server at runtime, so `app/api/*` BFF routes,
  // `proxy.ts` middleware and server cookie sessions were removed; the
  // browser calls the NestJS backend directly (see lib/axios.ts).
  output: "export",
  images: {
    // No Image Optimization server in static export; serve images as-is.
    unoptimized: true,
  },
  env: {
    API_URL: process.env.API_URL ?? "http://localhost:8000",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ??
      process.env.API_URL ??
      "http://localhost:8000",
  },
};

export default nextConfig;
