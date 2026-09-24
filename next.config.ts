import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/**
 * Photos uploaded in the admin live in the Supabase Storage bucket, so the
 * image optimiser must be allowed to fetch from that project — and only from
 * its public product-images bucket.
 */
function supabaseImages(): RemotePattern[] {
  const raw = process.env.SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    // Product photography still lives in the existing WordPress media library.
    // scripts/download-images.mjs pulls it local when the old site is retired.
    remotePatterns: [
      { protocol: "https", hostname: "voltcraft.org.ng", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "www.voltcraft.org.ng", pathname: "/wp-content/uploads/**" },
      ...supabaseImages(),
    ],
  },
  experimental: {
    serverActions: {
      // Product photos are resized in the browser before upload, but a phone
      // that cannot resize sends the original: allow up to the 4 MB the upload
      // action accepts, plus multipart overhead.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
