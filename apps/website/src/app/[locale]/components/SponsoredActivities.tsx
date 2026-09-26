import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "iconsax-reactjs";
import { Event } from "@ticketwaze/typescript-config";
import EventCard from "@/components/EventCard";

/**
 * Up to three events an admin sponsored (see `GET /events/sponsored`), in a
 * row on desktop and stacked on a phone.
 *
 * The API applies the explore feed's rules, so nothing here needs filtering.
 * The whole section disappears when nothing is sponsored or the API is
 * unreachable: the landing page must never break for a promotion.
 */
async function fetchSponsored(): Promise<Event[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/sponsored`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.events) ? data.events.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export default async function SponsoredActivities() {
  const events = await fetchSponsored();
  if (events.length === 0) return null;

  const t = await getTranslations("HomePage.sponsored");
  const locale = await getLocale();

  return (
    <section className="w-full bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col gap-[3rem] lg:gap-[4.5rem]">
      {/* Each card carries its own "Sponsored" tag, so the heading does not. */}
      <h2 className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[50px] text-deep-200">
        {t("title")}
      </h2>
      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {events.map((event) => (
          <li key={event.eventId} className="flex">
            <EventCard event={event} />
          </li>
        ))}
      </ul>
      {/* Same primary button as the pricing section, centred and only as wide
          as its label at every size. */}
      <a
        href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore`}
        target="_blank"
        rel="noopener noreferrer"
        className="self-center w-fit flex items-center justify-center gap-3 px-12 py-5 bg-primary-500 hover:bg-primary-600 transition-colors rounded-[10rem] text-white font-medium text-[1.4rem] leading-8"
      >
        {t("seeAll")}
        <ArrowRight size="18" color="#FFFFFF" />
      </a>
    </section>
  );
}
