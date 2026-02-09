import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import EventActions from "./EventActions";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { Link } from "@/i18n/navigation";
import MapComponent from "./MapComponent";
import { Call, Global, RouteSquare, Sms } from "iconsax-reactjs";
import TicketViewer from "./TicketViewer";
import { Ticket, User } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";

export default async function UpcomingEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Event");
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/upcoming/${slug}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const eventResponse = await eventRequest.json();
  const event = eventResponse.event;
  const organisation = event.organisation;
  const tickets: Ticket[] = event.tickets;

  const favoriteRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/favorite`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const favoriteResponse = await favoriteRequest.json();

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;

  return (
    <AttendeeLayout title="Event Page">
      <BackButton text={t("back")} />
      <div className="grid grid-cols-1 lg:grid-cols-[29fr_23fr] w-full ">
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {event.eventName}
        </span>
        <div className={"flex items-center justify-between w-full"}>
          <div className={"flex items-center gap-4"}>
            {organisation?.profileImageUrl ? (
              <Image
                src={organisation.profileImageUrl}
                width={35}
                height={35}
                alt={organisation.organisationName}
                className="rounded-full"
              />
            ) : (
              <span className="w-[35px] h-[35px] flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-[30px] font-primary">
                {organisation?.organisationName.slice()[0]?.toUpperCase()}
              </span>
            )}
            <div className={"flex flex-col"}>
              <span
                className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
              >
                {organisation.organisationName}{" "}
                {organisation.isVerified && <VerifiedOrganisationCheckMark />}
              </span>
            </div>
          </div>
          <Link
            href={`/organizers/${organisation.organisationId}`}
            className="border-2 py-[7.5px] px-[15px] lg:px-12 rounded-[100px] border-black font-semibold text-[1.5rem] "
          >
            {t("viewProfile")}
          </Link>
        </div>
      </div>
      <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 overflow-y-auto h-full">
        {/* Left column content */}
        <div className="flex flex-col gap-8 lg:overflow-y-auto min-h-0">
          <div className="w-full max-h-[298px] overflow-hidden rounded-[10px] flex-shrink-0">
            <Image
              src={event.eventImageUrl}
              width={580}
              height={298}
              alt={event.eventName}
              className="w-full"
            />
          </div>

          <EventActions
            event={event}
            user={session?.user as User}
            isFavorite={favoriteResponse.isFavorite}
          />
          <Separator />

          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <span
                className={
                  "font-semibold text-[1.6rem] leading-8 text-deep-200"
                }
              >
                {t("direction")}
              </span>

              <Link
                href={googleMapsUrl}
                target="_blank"
                className="flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
              >
                {t("open")}{" "}
                <RouteSquare variant="Bulk" color="#E45B00" size={20} />
              </Link>
            </div>
            <MapComponent event={event} />
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("about")}
            </span>
            <p className="text-[1.5rem] leading-12 text-neutral-700">
              {event.eventDescription}
            </p>
          </div>

          <Separator />

          <div>
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("contact")}
            </span>
          </div>
          <div className="flex flex-col gap-[5px]">
            <div className="flex items-center gap-4">
              <Sms size="20" color="#737c8a" variant="Bulk" />
              <span className="font-normal text-[1.5rem] leading-[30px] text-neutral-700">
                {organisation.organisationEmail}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Call size="20" color="#737c8a" variant="Bulk" />
              <span className="font-normal text-[1.5rem] leading-[30px] text-neutral-700">
                {organisation.organisationPhoneNumber}
              </span>
            </div>
            {organisation.organisationWebsite && (
              <div className="flex items-center gap-4">
                <Global size="20" color="#737c8a" variant="Bulk" />
                <span className="font-normal text-[1.5rem] leading-[30px] text-neutral-700">
                  {organisation.organisationWebsite}
                </span>
              </div>
            )}
          </div>

          {/* Tickets on mobile */}
          <div className="lg:hidden flex flex-col gap-4">
            <TicketViewer tickets={tickets} event={event} />
          </div>
        </div>

        {/* Tickets on desktop (second column) */}
        <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-20 p-4 pt-0">
          <TicketViewer tickets={tickets} event={event} />
        </div>
      </main>
    </AttendeeLayout>
  );
}
