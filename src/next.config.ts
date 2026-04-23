import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chỉ dùng standalone khi build trong Docker, không dùng trên Vercel
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" } : {}),

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
    ],
  },

  poweredByHeader: false,

  // Tối ưu tree-shaking cho các package lớn (Experimental - sử dụng cẩn trọng)
  experimental: {
    optimizePackageImports: ["sonner", "recharts"],
  },

  // 
  async headers() {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://taskmasterpro.com";

    return [
      // Security headers — áp dụng toàn bộ routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // CORS headers — chỉ áp dụng cho API routes
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: appUrl, // ← dùng env var thay vì hardcode
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
