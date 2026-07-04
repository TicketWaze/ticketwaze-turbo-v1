import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  securityHeaders,
  mergeCsp,
  CSP_SOURCES,
  connectForApi,
} from "@ticketwaze/security-headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const cdn = process.env.NEXT_PUBLIC_CLOUDFRONT_HOSTNAME;

// Report-only: violations are logged to the API, never blocked. Tune, then enforce.
const csp = mergeCsp(
  CSP_SOURCES.stripe,
  CSP_SOURCES.googleAuth,
  CSP_SOURCES.googleMaps,
  {
    imgSrc: cdn ? [`https://${cdn}`] : [],
    connectSrc: connectForApi(apiUrl),
    reportUri: apiUrl ? `${apiUrl}/csp-report` : undefined,
    reportOnly: true,
  }
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders({ csp }) }];
  },
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
