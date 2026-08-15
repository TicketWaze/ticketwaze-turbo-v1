import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * THE LOCALE-LESS LANDING GOOGLE REDIRECTS TO.
 *
 * The twin of `events/create/zoom-connected`, and it exists for the same
 * reason: the redirect URI registered with Google is one fixed URL, every page
 * in this dashboard lives under `/[locale]`, and there is no middleware to
 * rewrite a locale-less path. A redirect straight into `/[locale]/...` would
 * 404 — with the authorisation code already spent.
 *
 * So this sits outside `[locale]`, reads the locale back out of `state` (the
 * only field Google echoes), and forwards the query untouched.
 */
export default async function GoogleRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const state = typeof params.state === "string" ? params.state : "";
  const encodedLocale = state.split(".")[1];
  const locale = routing.locales.includes(encodedLocale as never)
    ? encodedLocale
    : routing.defaultLocale;

  // Forwarded whole rather than rebuilt: `code` and `state` are single-use and
  // must arrive exactly as Google sent them, and `error` matters when present.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }

  redirect(`/${locale}/events/create/google-connected?${query.toString()}`);
}
