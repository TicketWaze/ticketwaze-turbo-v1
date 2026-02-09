import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { Call, Global, Sms, Ticket } from "iconsax-reactjs";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import OrganizerActions from "./OrganizerActions";
import Slugify from "@/lib/Slugify";
import { redirect } from "@/i18n/navigation";
import { Event, User } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";
import EventCard from "@/components/shared/EventCard";

export default async function OrganizerProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Organizers");
  const session = await auth();
  const organisationRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${slug}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const organisationResponse = await organisationRequest.json();
  const organisation = organisationResponse.organisation;
  const events: Event[] = organisation.events;
  const upcomingEvents: Event[] = organisation.upcomingEvents;

  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  return (
    <AttendeeLayout title="OrganizerProfile">
      <div className="flex flex-col gap-4">
        <BackButton text={t("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {organisation.organisationName}
        </span>
      </div>
      <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 overflow-y-auto h-full">
        <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
          <div className="w-full max-h-[298px] overflow-hidden rounded-[10px] flex-shrink-0">
            {organisation.profileImageUrl ? (
              <Image
                src={organisation.profileImageUrl}
                width={580}
                height={298}
                alt={organisation.organisationName}
                className="w-full"
              />
            ) : (
              <div className="w-full h-[298px] font-primary text-white bg-black text-9xl flex justify-center items-center">
                {" "}
                {organisation.organisationName.slice()[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <OrganizerActions
            events={events}
            organisation={organisation}
            user={session?.user as User}
          />
          <Separator />
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("profile.about")}
            </span>
            <p className="text-[1.5rem] leading-12 text-neutral-700">
              {organisation.organisationDescription}
            </p>
          </div>
          <Separator />
          <div>
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("profile.contact")}
            </span>
          </div>
          <div className={"flex flex-col gap-[5px]"}>
            <div className={"flex items-center gap-4"}>
              <Sms size="20" color="#737c8a" variant="Bulk" />
              <span
                className={
                  "font-normal text-[1.5rem] leading-[30px] text-neutral-700"
                }
              >
                {organisation.organisationEmail}
              </span>
            </div>
            <div className={"flex items-center gap-4"}>
              <Call size="20" color="#737c8a" variant="Bulk" />
              <span
                className={
                  "font-normal text-[1.5rem] leading-[30px] text-neutral-700"
                }
              >
                {organisation.organisationPhoneNumber}
              </span>
            </div>
            {organisation.organisationWebsite && (
              <div className={"flex items-center gap-4"}>
                <Global size="20" color="#737c8a" variant="Bulk" />
                <span
                  className={
                    "font-normal text-[1.5rem] leading-[30px] text-neutral-700"
                  }
                >
                  {organisation.organisationWebsite}
                </span>
              </div>
            )}
          </div>
          <Separator />
          <div className="lg:hidden flex flex-col gap-8">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("profile.upcoming")}
            </span>
            <ul className="flex flex-col gap-8">
              {upcomingEvents.map((event) => {
                const slug = Slugify(event.eventName);
                return (
                  <li key={event.eventId} className="lg:pr-4">
                    <EventCard
                      aside={true}
                      // href={`/explore/${slug}`}
                      event={event}
                    />
                  </li>
                );
              })}
            </ul>
            {events.length === 0 && (
              <div className="flex flex-col items-center gap-[50px]">
                <div className="h-[120px] w-[120px] bg-neutral-100 rounded-full flex items-center justify-center">
                  <div className="w-[90px] h-[90px] bg-neutral-200 flex items-center justify-center rounded-full">
                    <Ticket size="50" color="#0D0D0D" variant="Bulk" />
                  </div>
                </div>
                <span className="font-primary text-[1.8rem] leading-8 text-neutral-600">
                  {t("profile.noUpcoming")}
                </span>
              </div>
            )}
          </div>
          <div></div>
        </div>
        <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-20 p-4 pt-0">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("profile.upcoming")}
          </span>
          <ul className="flex flex-col gap-8">
            {upcomingEvents.map((event) => {
              const slug = Slugify(event.eventName);
              return (
                <li key={event.eventId} className="lg:pr-4">
                  <EventCard
                    aside={true}
                    // href={`/explore/${slug}`}
                    event={event}
                  />
                </li>
              );
            })}
          </ul>
          {events.length === 0 && (
            <div className="flex flex-col items-center gap-[50px]">
              <div className="h-[120px] w-[120px] bg-neutral-100 rounded-full flex items-center justify-center">
                <div className="w-[90px] h-[90px] bg-neutral-200 flex items-center justify-center rounded-full">
                  <Ticket size="50" color="#0D0D0D" variant="Bulk" />
                </div>
              </div>
              <span className="font-primary text-[1.8rem] leading-8 text-neutral-600">
                {t("profile.noUpcoming")}
              </span>
            </div>
          )}
        </div>
      </main>
    </AttendeeLayout>
  );
}
