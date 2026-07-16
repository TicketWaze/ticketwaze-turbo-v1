/**
 * Shared HTTP security headers for every TicketWaze Next.js app.
 *
 * Consumed directly from `next.config.ts`:
 *
 *   import { securityHeaders } from "@ticketwaze/security-headers";
 *   async headers() {
 *     return [{ source: "/(.*)", headers: securityHeaders() }];
 *   }
 *
 * Phase 1 — `baselineSecurityHeaders`: safe to enforce on every app.
 * Phase 2 — `buildContentSecurityPolicy`: start in report-only mode
 *           (`reportOnly: true`) so violations are logged, not blocked.
 */

export type SecurityHeader = { key: string; value: string };

/**
 * Baseline headers. None of these can break a normal Next.js app:
 * - X-Content-Type-Options: stop MIME-sniffing.
 * - X-Frame-Options: SAMEORIGIN mirrors CSP `frame-ancestors 'self'` for
 *   browsers that don't honor CSP framing (clickjacking defense).
 * - Referrer-Policy: send origin only on cross-origin navigations, so URLs
 *   carrying tokens/ids don't leak to third parties.
 * - Permissions-Policy: deny powerful features the apps don't use.
 * - Strict-Transport-Security: force HTTPS. Harmless locally (HSTS is
 *   ignored over plain HTTP) and enforced in production over TLS.
 */
export const baselineSecurityHeaders: SecurityHeader[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

export type CspOptions = {
  /** Extra hosts allowed to load/execute scripts (e.g. Stripe, Google). */
  scriptSrc?: string[];
  /** Extra hosts for stylesheets. */
  styleSrc?: string[];
  /** Extra XHR/fetch/WebSocket targets (your API, socket.io, Stripe API...). */
  connectSrc?: string[];
  /** Extra image hosts (CloudFront, Google avatars/maps...). */
  imgSrc?: string[];
  /** Extra hosts you embed in an iframe (Stripe checkout, Turnstile...). */
  frameSrc?: string[];
  /** Extra font hosts. */
  fontSrc?: string[];
  /** Extra form POST targets (MonCash/Kobara redirects...). */
  formAction?: string[];
  /** Where the browser POSTs violation reports. */
  reportUri?: string;
  /** When true, emit Content-Security-Policy-Report-Only (log, don't block). */
  reportOnly?: boolean;
};

const uniq = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean)));

/**
 * Build a CSP header. Kept deliberately permissive on script/style with
 * `'unsafe-inline'` because Next.js emits inline runtime scripts and styles
 * without nonces. Ship it as report-only first, watch the reports, then
 * tighten (ideally to nonces) before enforcing.
 */
export function buildContentSecurityPolicy(
  options: CspOptions = {}
): SecurityHeader {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'self'"],
    "img-src": uniq(["'self'", "data:", "blob:", ...(options.imgSrc ?? [])]),
    "script-src": uniq(["'self'", "'unsafe-inline'", ...(options.scriptSrc ?? [])]),
    "style-src": uniq(["'self'", "'unsafe-inline'", ...(options.styleSrc ?? [])]),
    "font-src": uniq(["'self'", "data:", ...(options.fontSrc ?? [])]),
    "connect-src": uniq(["'self'", ...(options.connectSrc ?? [])]),
    "frame-src": uniq(["'self'", ...(options.frameSrc ?? [])]),
    "form-action": uniq(["'self'", ...(options.formAction ?? [])]),
    "upgrade-insecure-requests": [],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");

  const value = options.reportUri ? `${policy}; report-uri ${options.reportUri}` : policy;

  return {
    key: options.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy",
    value,
  };
}

/**
 * Returns the full header list for a `headers()` entry: the baseline headers,
 * plus a CSP header when `csp` options are supplied.
 */
export function securityHeaders(
  options: { csp?: CspOptions } = {}
): SecurityHeader[] {
  const headers = [...baselineSecurityHeaders];
  if (options.csp) headers.push(buildContentSecurityPolicy(options.csp));
  return headers;
}

/**
 * Per-directive source presets for the third-party services the apps load.
 * Compose the ones an app actually uses with `mergeCsp`.
 */
export const CSP_SOURCES: Record<string, CspOptions> = {
  stripe: {
    scriptSrc: ["https://js.stripe.com"],
    connectSrc: ["https://api.stripe.com"],
    frameSrc: ["https://js.stripe.com", "https://checkout.stripe.com", "https://hooks.stripe.com"],
  },
  googleAuth: {
    scriptSrc: ["https://accounts.google.com/gsi/client", "https://apis.google.com"],
    connectSrc: ["https://accounts.google.com"],
    frameSrc: ["https://accounts.google.com"],
    imgSrc: ["https://*.googleusercontent.com"],
  },
  googleAnalytics: {
    // GA4 via @next/third-parties: gtag.js is served from googletagmanager.com,
    // collection endpoints live on google-analytics.com (regional *.google-analytics.com).
    scriptSrc: ["https://www.googletagmanager.com"],
    connectSrc: [
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://analytics.google.com",
    ],
    imgSrc: [
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://www.googletagmanager.com",
    ],
  },
  googleMaps: {
    scriptSrc: ["https://maps.googleapis.com"],
    connectSrc: ["https://maps.googleapis.com"],
    imgSrc: ["https://maps.gstatic.com", "https://maps.googleapis.com", "https://*.gstatic.com"],
  },
  turnstile: {
    scriptSrc: ["https://challenges.cloudflare.com"],
    frameSrc: ["https://challenges.cloudflare.com"],
  },
  vercelAnalytics: {
    scriptSrc: ["https://va.vercel-scripts.com"],
    connectSrc: ["https://*.vercel-insights.com"],
  },
};

type CspSourceKey =
  | "scriptSrc"
  | "styleSrc"
  | "connectSrc"
  | "imgSrc"
  | "frameSrc"
  | "fontSrc"
  | "formAction";

/**
 * Merge several partial CSP option objects into one. Source arrays are unioned;
 * `reportUri` / `reportOnly` take the last defined value.
 */
export function mergeCsp(...parts: CspOptions[]): CspOptions {
  const out: CspOptions = {};
  const push = (key: CspSourceKey, values?: string[]): void => {
    if (!values || values.length === 0) return;
    out[key] = uniq([...(out[key] ?? []), ...values]);
  };
  for (const part of parts) {
    push("scriptSrc", part.scriptSrc);
    push("styleSrc", part.styleSrc);
    push("connectSrc", part.connectSrc);
    push("imgSrc", part.imgSrc);
    push("frameSrc", part.frameSrc);
    push("fontSrc", part.fontSrc);
    push("formAction", part.formAction);
    if (part.reportUri !== undefined) out.reportUri = part.reportUri;
    if (part.reportOnly !== undefined) out.reportOnly = part.reportOnly;
  }
  return out;
}

/**
 * connect-src entries for your own API: the https origin plus its ws(s) form,
 * since the apps also open socket.io connections to it. Returns [] if unset.
 */
export function connectForApi(apiUrl?: string): string[] {
  if (!apiUrl) return [];
  return uniq([apiUrl, apiUrl.replace(/^http/i, "ws")]);
}
