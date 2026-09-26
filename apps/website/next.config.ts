import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  securityHeaders,
  mergeCsp,
  CSP_SOURCES,
  connectForApi,
} from "@ticketwaze/security-headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const cdn = process.env.NEXT_PUBLIC_CLOUDFRONT_HOSTNAME?.trim();

// Report-only: violations are logged to the API, never blocked. Tune, then enforce.
const csp = mergeCsp(
  CSP_SOURCES.turnstile,
  CSP_SOURCES.vercelAnalytics,
  CSP_SOURCES.googleAnalytics,
  {
  imgSrc: cdn ? [`https://${cdn}`] : [],
  connectSrc: connectForApi(apiUrl),
  reportUri: apiUrl ? `${apiUrl}/csp-report` : undefined,
  reportOnly: true,
});

const nextConfig: NextConfig = {
  // Event images on the landing page's sponsored section come from the CDN.
  images: {
    remotePatterns: cdn ? [{ protocol: "https", hostname: cdn }] : [],
  },
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders({ csp }) }];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
