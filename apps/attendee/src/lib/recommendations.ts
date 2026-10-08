import { Event } from "@ticketwaze/typescript-config";

type Listed = Event & { viewCount?: number };

/**
 * Up to four other upcoming activities for an activity page: the same
 * organisation first, then the same topic, then the most viewed (Figma "More
 * events recommended for you"). Plain module so server pages can call it.
 */
export function pickRecommendations(current: Event, pool: Listed[], count = 4) {
  const others = pool.filter((e) => e.eventId !== current.eventId);
  const score = (e: Listed) =>
    (e.organisationId === current.organisationId ? 2 : 0) +
    (e.eventType === current.eventType ? 1 : 0);
  return [...others]
    .sort(
      (a, b) => score(b) - score(a) || (b.viewCount ?? 0) - (a.viewCount ?? 0),
    )
    .slice(0, count);
}
