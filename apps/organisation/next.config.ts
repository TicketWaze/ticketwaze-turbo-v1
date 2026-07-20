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
  CSP_SOURCES.googleAnalytics,
  {
    imgSrc: cdn ? [`https://${cdn}`] : [],
    connectSrc: connectForApi(apiUrl),
    reportUri: apiUrl ? `${apiUrl}/csp-report` : undefined,
    reportOnly: true,
  }
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Create forms post images through server actions, whose default body limit
    // is 1MB — less than a single phone photo. Images are downscaled in the
    // browser first (see lib/compressImage.ts), so this ceiling is headroom for
    // a 5-photo restaurant gallery rather than an invitation to send raw files.
    // Keep in step with the API's multipart limit in config/bodyparser.ts.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
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
