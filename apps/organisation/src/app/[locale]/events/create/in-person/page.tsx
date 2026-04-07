import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
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

export default async function InPersonEventTypePage() {
  const t = await getTranslations("Events.create_event.list.inPerson");
  const links = [
    {
      label: t("categories.conference.title"),
      href: "/conference",
      Icon: People,
      value: t("categories.conference.value"),
    },
    {
      label: t("categories.concert.title"),
      href: "/concert",
      Icon: Microphone2,
      value: t("categories.concert.value"),
    },
    {
      label: t("categories.festival.title"),
      href: "/festival",
      Icon: PartyPopper,
      value: t("categories.festival.value"),
    },
    {
      label: t("categories.comedy.title"),
      href: "/comedy",
      Icon: Laugh,
      value: t("categories.comedy.value"),
    },
    {
      label: t("categories.theater.title"),
      href: "/theater",
      Icon: Drama,
      value: t("categories.theater.value"),
    },
    {
      label: t("categories.tournament.title"),
      href: "/tournament",
      Icon: Trophy,
      value: t("categories.tournament.value"),
    },
    {
      label: t("categories.workshop.title"),
      href: "/workshop",
      Icon: Wrench,
      value: t("categories.workshop.value"),
    },
    {
      label: t("categories.seminar.title"),
      href: "/seminar",
      Icon: Presentation,
      value: t("categories.seminar.value"),
    },
    {
      label: t("categories.networking.title"),
      href: "/networking",
      Icon: Handshake,
      value: t("categories.networking.value"),
    },
    {
      label: t("categories.startup.title"),
      href: "/startup",
      Icon: Rocket,
      value: t("categories.startup.value"),
    },
    {
      label: t("categories.food_festival.title"),
      href: "/food_festival",
      Icon: Utensils,
      value: t("categories.food_festival.value"),
    },
    {
      label: t("categories.art.title"),
      href: "/art",
      Icon: Palette,
      value: t("categories.art.value"),
    },
    {
      label: t("categories.cultural.title"),
      href: "/cultural",
      Icon: Globe,
      value: t("categories.cultural.value"),
    },
    {
      label: t("categories.charity.title"),
      href: "/charity",
      Icon: HeartHandshake,
      value: t("categories.charity.value"),
    },
    {
      label: t("categories.fundraiser.title"),
      href: "/fundraiser",
      Icon: HandCoins,
      value: t("categories.fundraiser.value"),
    },
    {
      label: t("categories.meetup.title"),
      href: "/meetup",
      Icon: Users,
      value: t("categories.meetup.value"),
    },
    {
      label: t("categories.community.title"),
      href: "/community",
      Icon: Building2,
      value: t("categories.community.value"),
    },
  ];
  return (
    <OrganizerLayout title="InPersonEventTypePage">
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <ul className="list-3 w-full overflow-y-scroll pb-4">
        {links.map(({ Icon, label, href }) => {
          return (
            <li key={label} className={"cursor-pointer"}>
              <EventTypeCardLink Icon={Icon} href={href} label={label} />
            </li>
          );
        })}
      </ul>
    </OrganizerLayout>
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
      href={`/events/create/in-person/${href}`}
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
