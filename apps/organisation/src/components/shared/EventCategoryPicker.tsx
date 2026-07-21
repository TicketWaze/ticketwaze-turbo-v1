import { Link } from "@/i18n/navigation";
import { ArrowRight2, Icon, Microphone2, People } from "iconsax-reactjs";
import {
  Building2,
  Drama,
  Globe,
  HandCoins,
  Handshake,
  HeartHandshake,
  Laugh,
  Palette,
  PartyPopper,
  Presentation,
  Rocket,
  Trophy,
  Users,
  Utensils,
  Wrench,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * The in-person category grid (conference, concert, festival…).
 *
 * Shared because it is reached from two directions: creating an event from
 * scratch, and publishing a teaser that has been sitting on the dashboard. Both
 * end at the same wizard, so both must offer the same categories — keeping one
 * list means a category added here cannot go missing from the other route.
 *
 * `hrefPrefix` is what differs: the picker only appends `/{category}`.
 */
export default async function EventCategoryPicker({
  hrefPrefix,
}: {
  hrefPrefix: string;
}) {
  const t = await getTranslations("Events.create_event.list.inPerson");
  const links: { label: string; href: string; Icon: Icon }[] = [
    {
      label: t("categories.conference.title"),
      href: "conference",
      Icon: People,
    },
    {
      label: t("categories.concert.title"),
      href: "concert",
      Icon: Microphone2,
    },
    {
      label: t("categories.festival.title"),
      href: "festival",
      Icon: PartyPopper,
    },
    { label: t("categories.comedy.title"), href: "comedy", Icon: Laugh },
    { label: t("categories.theater.title"), href: "theater", Icon: Drama },
    {
      label: t("categories.tournament.title"),
      href: "tournament",
      Icon: Trophy,
    },
    { label: t("categories.workshop.title"), href: "workshop", Icon: Wrench },
    {
      label: t("categories.seminar.title"),
      href: "seminar",
      Icon: Presentation,
    },
    {
      label: t("categories.networking.title"),
      href: "networking",
      Icon: Handshake,
    },
    { label: t("categories.startup.title"), href: "startup", Icon: Rocket },
    {
      label: t("categories.food_festival.title"),
      href: "food_festival",
      Icon: Utensils,
    },
    { label: t("categories.art.title"), href: "art", Icon: Palette },
    { label: t("categories.cultural.title"), href: "cultural", Icon: Globe },
    {
      label: t("categories.charity.title"),
      href: "charity",
      Icon: HeartHandshake,
    },
    {
      label: t("categories.fundraiser.title"),
      href: "fundraiser",
      Icon: HandCoins,
    },
    { label: t("categories.meetup.title"), href: "meetup", Icon: Users },
    {
      label: t("categories.community.title"),
      href: "community",
      Icon: Building2,
    },
  ];

  return (
    <ul className="list-3 w-full overflow-y-scroll pb-4">
      {links.map(({ Icon, label, href }) => (
        <li key={label} className={"cursor-pointer"}>
          <EventTypeCardLink
            Icon={Icon}
            href={`${hrefPrefix}/${href}`}
            label={label}
          />
        </li>
      ))}
    </ul>
  );
}

function EventTypeCardLink({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: Icon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "py-14 px-6 rounded-[10px] bg-neutral-100 hover:bg-primary-50 flex justify-between transition-all duration-500 cursor-pointer group"
      }
    >
      <div className={"flex items-center gap-6"}>
        <Icon
          size="25"
          className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
          variant="Bulk"
        />
        <span
          className={
            "font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900 group-hover:text-primary-500"
          }
        >
          {label}
        </span>
      </div>
      <div
        className={
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-neutral-200 group-hover:bg-primary-100"
        }
      >
        <ArrowRight2
          size="20"
          className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
          variant="Bulk"
        />
      </div>
    </Link>
  );
}
