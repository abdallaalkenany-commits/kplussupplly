import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/account/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
