/**
 * Front-end error reporting.
 *
 * Every app renders a `global-error` boundary that showed the user a friendly
 * screen and then threw the error away, so a crash in production left no trace
 * anywhere. This forwards it to the API's collector, which posts it to #logs
 * alongside server-side failures.
 */

export type ClientApp = "admin" | "attendee" | "organisation" | "payment" | "website";

export type ClientErrorSource = "render" | "runtime" | "promise";

export interface ClientErrorReport {
  app: ClientApp;
  source: ClientErrorSource;
  message: string;
  stack?: string | null;
  digest?: string | null;
}

/**
 * Errors worth reporting from this session, so a crash loop cannot turn into a
 * flood. The API throttles per IP as the real defence; this stops us wasting
 * that budget — and the user's bandwidth — before the request is even made.
 */
const MAX_REPORTS_PER_SESSION = 5;
let reportsSent = 0;

/**
 * Messages already reported. A React error typically arrives twice (once from
 * the boundary, once from window.onerror), and a broken render loop can repeat
 * the same throw hundreds of times a second.
 */
const seen = new Set<string>();

/**
 * Noise the browser generates that we can neither fix nor act on. Mirrored
 * server-side, deliberately: filtering here saves the request, and filtering
 * there catches anything an older deployed bundle still sends.
 */
const IGNORED = [
  "ResizeObserver loop",
  "Script error.",
  "chrome-extension://",
  "moz-extension://",
  "safari-extension://",
  "The play() request was interrupted",
];

function isNoise(message: string, stack?: string | null): boolean {
  const haystack = `${message}\n${stack ?? ""}`;
  return IGNORED.some((pattern) => haystack.includes(pattern));
}

/**
 * Send one error to the collector.
 *
 * Deliberately swallows every failure. A reporter that throws, retries, or
 * surfaces its own error turns one broken page into two — and it runs inside
 * an error handler, where a second throw is genuinely hard to trace.
 */
export function reportClientError(report: ClientErrorReport): void {
  try {
    if (typeof window === "undefined") return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const message = String(report.message ?? "").slice(0, 2000);
    if (!message) return;
    if (isNoise(message, report.stack)) return;

    const fingerprint = `${report.source}:${message}`;
    if (seen.has(fingerprint)) return;
    if (reportsSent >= MAX_REPORTS_PER_SESSION) return;

    seen.add(fingerprint);
    reportsSent += 1;

    const body = JSON.stringify({
      app: report.app,
      source: report.source,
      message,
      stack: report.stack ? String(report.stack).slice(0, 4000) : undefined,
      url: window.location.href.slice(0, 1000),
      userAgent: navigator.userAgent?.slice(0, 500),
      digest: report.digest ?? undefined,
    });

    // `keepalive` so the report still goes out when the error is what is taking
    // the page down — an ordinary fetch is cancelled on unload.
    void fetch(`${apiUrl}/logs/client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let reporting break the page it is reporting on.
  }
}

/**
 * Attach global listeners for errors React never sees: uncaught throws and
 * unhandled promise rejections.
 *
 * The rejection handler matters more than it looks — a `fetch` that throws
 * inside an event handler or effect lands there, not in `window.onerror`, so
 * without it most real failures go unreported.
 *
 * Returns a cleanup function for React's effect contract.
 */
export function installClientErrorReporting(app: ClientApp): () => void {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    reportClientError({
      app,
      source: "runtime",
      message: event.message || String(event.error?.message ?? "Unknown error"),
      stack: event.error?.stack ?? null,
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    reportClientError({
      app,
      source: "promise",
      // A rejection can carry anything, not just an Error — `String(reason)` on
      // a plain object gives "[object Object]", so prefer a message if present.
      message:
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : (reason?.message ?? JSON.stringify(reason ?? "Unknown rejection")),
      stack: reason instanceof Error ? reason.stack : null,
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
