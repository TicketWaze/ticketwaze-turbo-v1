import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * THE LOCALE-LESS LANDING ZOOM ACTUALLY REDIRECTS TO.
 *
 * `ZOOM_REDIRECT_URI` is one fixed URL registered on the Marketplace app, but
 * every page in this dashboard lives under `/[locale]`. There is no middleware
 * rewriting locale-less paths, so a redirect straight into `/[locale]/...`
 * would 404 — and Zoom would have consumed the authorisation code by then.
 *
 * So this sits outside `[locale]`, reads the locale back out of `state` (the
 * only field Zoom echoes), and forwards the query untouched to the page that
 * does the work.
 */
export default async function ZoomRedirectPage({
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
  // must arrive exactly as Zoom sent them, and `error` matters when it is there.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }

  redirect(`/${locale}/events/create/zoom-connected?${query.toString()}`);
}
