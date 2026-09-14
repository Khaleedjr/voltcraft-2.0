import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photography still lives in the existing WordPress media library.
    // scripts/download-images.mjs pulls it local when the old site is retired.
    remotePatterns: [
      { protocol: "https", hostname: "voltcraft.org.ng", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "www.voltcraft.org.ng", pathname: "/wp-content/uploads/**" },
    ],
  },
};

export default nextConfig;
