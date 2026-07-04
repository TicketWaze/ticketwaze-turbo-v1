import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  securityHeaders,
  mergeCsp,
  CSP_SOURCES,
  connectForApi,
} from "@ticketwaze/security-headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Report-only: violations are logged to the API, never blocked. Tune, then enforce.
const csp = mergeCsp(CSP_SOURCES.turnstile, CSP_SOURCES.vercelAnalytics, {
  connectSrc: connectForApi(apiUrl),
  reportUri: apiUrl ? `${apiUrl}/csp-report` : undefined,
  reportOnly: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders({ csp }) }];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
