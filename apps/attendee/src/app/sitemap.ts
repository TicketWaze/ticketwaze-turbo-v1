import type { MetadataRoute } from "next";
import type {
  Event,
  PublicSale,
  Raffle,
  Restaurant,
} from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_ATTENDEE_URL ?? "";

// Rebuilt at most hourly: new events reach Google within the hour without
// hitting the API on every crawler request.
export const revalidate = 3600;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      next: { revalidate: 3600 },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** One entry per locale, each listing the other locales as alternates. */
function entry(
  path: string,
  options: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`]),
  );
  return routing.locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    ...options,
    alternates: { languages },
  }));
}

/**
 * Every public page a search engine should know about: the explore feed and
 * each public event, raffle, sale and restaurant. Organiser pages are linked
 * from every event page, so crawlers reach them from there.
 *
 * Upcoming events get the highest priority — they are what people search for,
 * and what Google can show as event rich results. Past events stay listed at a
 * low priority: their pages still answer searches for the event's name.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventsRes, rafflesRes, salesRes, restaurantsRes] = await Promise.all([
    getJson<{ events?: Event[]; pastEvents?: Event[]; comingSoon?: Event[] }>(
      "/events",
    ),
    getJson<{ raffles?: Raffle[] }>("/explore/raffles"),
    getJson<{ sales?: PublicSale[] }>("/explore/sales"),
    getJson<{ restaurants?: Restaurant[] }>("/explore/restaurants"),
  ]);

  const isPublic = (event: Event) => !event.isPrivate;
  const eventPath = (event: Event) =>
    `/explore/${slugify(event.eventName, event.eventId)}`;
  const lastModified = (value: unknown) =>
    value ? new Date(String(value)) : new Date();

  return [
    ...entry("/explore", {
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    }),
    ...[...(eventsRes?.events ?? []), ...(eventsRes?.comingSoon ?? [])]
      .filter(isPublic)
      .flatMap((event) =>
        entry(eventPath(event), {
          lastModified: lastModified(event.updatedAt),
          changeFrequency: "daily",
          priority: 0.9,
        }),
      ),
    ...(eventsRes?.pastEvents ?? []).filter(isPublic).flatMap((event) =>
      entry(eventPath(event), {
        lastModified: lastModified(event.updatedAt),
        changeFrequency: "monthly",
        priority: 0.3,
      }),
    ),
    ...(rafflesRes?.raffles ?? []).flatMap((raffle) =>
      entry(`/explore/raffle/${slugify(raffle.title, raffle.raffleId)}`, {
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      }),
    ),
    ...(salesRes?.sales ?? []).flatMap((sale) =>
      entry(`/explore/sale/${slugify(sale.title, sale.saleId)}`, {
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      }),
    ),
    ...(restaurantsRes?.restaurants ?? []).flatMap((restaurant) =>
      entry(`/explore/restaurant/${restaurant.slug}`, {
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    ),
  ];
}
