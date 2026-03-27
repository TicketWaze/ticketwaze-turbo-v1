import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: String(process.env.NEXT_PUBLIC_CLOUDFRONT_HOSTNAME!),
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
