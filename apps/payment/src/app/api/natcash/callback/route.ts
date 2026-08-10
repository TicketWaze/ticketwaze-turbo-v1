/**
 * NatCash callback gateway.
 *
 * This is the single callback URL registered in the NatCash merchant dashboard —
 * NatCash only accepts one, so it must serve every kind of NatCash purchase and
 * carry no per-transaction information in its path. Everything needed comes back
 * in the callback's own parameters (orderNumber, code, transId, signature).
 *
 * It lives under /api rather than in `[locale]` for two reasons: a route handler
 * can answer both GET and POST — the spec never says which NatCash sends — and
 * the i18n middleware skips /api, so the URL in their dashboard stays stable
 * instead of bouncing through a locale redirect.
 *
 * The work itself belongs to the API, which holds the signing secrets and the
 * orders: this only relays the parameters and follows the `redirectUrl` it gets
 * back, the same contract the MonCash gateway page uses.
 */

interface CallbackResult {
  status?: string;
  redirectUrl?: string;
}

const fallbackUrl = () =>
  `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore`;

/**
 * Pulls the callback parameters out of wherever NatCash put them. A browser
 * redirect carries them in the query string; a server-to-server POST may send
 * JSON or form-encoded, so all three are read and the body wins.
 */
async function readParams(request: Request): Promise<Record<string, string>> {
  const params: Record<string, string> = {};

  new URL(request.url).searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (request.method !== "POST") return params;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      for (const [key, value] of Object.entries(body ?? {})) {
        if (value !== null && value !== undefined) params[key] = String(value);
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      form.forEach((value, key) => {
        params[key] = String(value);
      });
    }
  } catch {
    // A malformed body is not worth failing over — the query string may still
    // hold everything, and the API rejects the callback if it does not.
  }

  return params;
}

async function handle(request: Request) {
  const params = await readParams(request);
  const isBrowser = request.method === "GET";

  let result: CallbackResult = {};
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/natcash/callback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        cache: "no-store",
      },
    );
    result = (await response.json()) as CallbackResult;
  } catch {
    result = { status: "failed" };
  }

  const target = result.redirectUrl ?? fallbackUrl();

  // The payer's browser is sent on to the result page; a server-to-server caller
  // gets the outcome it can actually read.
  if (isBrowser) {
    return Response.redirect(target, 302);
  }
  return Response.json({ status: result.status ?? "failed", redirectUrl: target });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
