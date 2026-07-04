/* eslint-disable @typescript-eslint/no-explicit-any */
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";
import EventActions from "./EventActions";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Calendar2,
  Clock,
  Google,
  Location,
  RouteSquare,
  SecurityUser,
} from "iconsax-reactjs";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import FollowButton from "./FollowButton";
import { auth } from "@/lib/auth";
import Map from "./MapComponent";
import { Link, redirect } from "@/i18n/navigation";
import AddToCalendar from "./AddToCalendar";
import { Metadata } from "next";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Capitalize from "@/lib/Capitalize";
import StripHtml from "@/lib/StripHtml";
import { extractIdFromSlug } from "@/lib/Slugify";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import AnimatedEventPage from "./AnimatedEventPage";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import isEventPast from "@/lib/isEventPast";
import {
  JsonLd,
  buildEventJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/structuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  // Descriptions are rich text (HTML); strip tags so they don't leak into
  // meta/OpenGraph previews, and trim to a sensible preview length.
  const plainDescription = StripHtml(event.eventDescription).slice(0, 200);
  return {
    title: event.eventName,
    description: plainDescription,
    openGraph: {
      title: event.eventName,
      description: plainDescription,
      type: "website",
      images: event.eventImageUrl
        ? [
            {
              url: event.eventImageUrl,
              secureUrl: event.eventImageUrl,
              width: 1200,
              height: 630,
              alt: event.eventName,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.eventName,
      description: plainDescription,
      images: event.eventImageUrl ? [event.eventImageUrl] : undefined,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const session = await auth();
  const locale = await getLocale();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const organisation = eventResponse.organisation;
  const eventPerformers = event.eventPerformers;
  const t = await getTranslations("Event");

  if (event.eventType === "private") {
    return (
      <AttendeeLayout title={event.eventName}>
        <AnimatedEventPage>
          <BackButton text={t("back")} />
          <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
            {event.eventName}
          </span>
          <div
            className={
              "w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-20"
            }
          >
            <div
              className={
                "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <SecurityUser size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className={"flex flex-col gap-12 items-center text-center"}>
              <p
                className={
                  "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
                }
              >
                {t("notInvited")}
              </p>
            </div>
          </div>
        </AnimatedEventPage>
      </AttendeeLayout>
    );
  }

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

  if (favoriteResponse.status === "failed") {
    redirect({ href: "/explore", locale });
  }

  const isFollowing = organisation.followers.filter(
    (follower: any) => follower.userId === session?.user.userId,
  );

  const layoutT = await getTranslations("Layout");
  const eventUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${slug}`;
  const eventJsonLd = buildEventJsonLd({
    event,
    organisation,
    url: eventUrl,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: layoutT("links.explore"), path: `/${locale}/explore` },
    { name: event.eventName },
  ]);

  return (
    <AttendeeLayout title={event.eventName}>
      <JsonLd data={eventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <AnimatedEventPage>
        <BackButton text={t("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {event.eventName}
        </span>
        <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-y-auto lg:h-full">
          <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
            <EventImageLightbox
              src={event.eventImageUrl}
              alt={event.eventName}
              width={580}
              height={298}
            />
            <EventActions
              event={event}
              isFavorite={favoriteResponse.isFavorite}
              isPast={isEventPast(event)}
            />
            <Separator />
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("about")}
              </span>
              <div
                className="rich-text text-[1.6rem] font-sans leading-10 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: event.eventDescription }}
              />
            </div>
            {eventPerformers.length > 0 && (
              <>
                <Separator />
                <ul className=" flex items-center gap-8 overflow-x-auto scroll-smooth scrollbar-hide w-full min-h-48">
                  {eventPerformers.map((eventPerformer) => (
                    <Link
                      href={eventPerformer.performerLink}
                      target="_blank"
                      key={eventPerformer.eventPerformerId}
                      className="flex items-center justify-center w-48 h-48 overflow-hidden rounded-full shrink-0"
                    >
                      <Image
                        src={eventPerformer.performerProfileUrl}
                        width={120}
                        height={120}
                        loading="eager"
                        alt={eventPerformer.performerName}
                      />
                    </Link>
                  ))}
                </ul>
              </>
            )}
            {/* <Separator />
            <div>
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("contact")}
              </span>
            </div>
            <div className={"flex flex-col gap-2"}>
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
            </div> */}

            <div className="lg:hidden flex flex-col gap-8">
              <div className={"flex flex-col gap-8"}>
                <span
                  className={
                    "font-semibold text-[1.6rem] leading-8 text-deep-200"
                  }
                >
                  {t("details")}
                </span>
                {/*  organizer*/}
                <div className={"flex items-center justify-between w-full"}>
                  <Link
                    href={`/organisations/${organisation.organisationId}`}
                    className={"flex items-center gap-4"}
                  >
                    {organisation?.profileImageUrl ? (
                      <Image
                        src={organisation.profileImageUrl}
                        width={35}
                        height={35}
                        alt={organisation.organisationName}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                        {organisation?.organisationName
                          .slice()[0]
                          ?.toUpperCase()}
                      </span>
                    )}
                    <div className={"flex flex-col"}>
                      <span
                        className={
                          "font-normal text-[1.4rem] leading-8 text-deep-200"
                        }
                      >
                        {organisation.organisationName}{" "}
                        {organisation.isVerified && (
                          <VerifiedOrganisationCheckMark />
                        )}
                      </span>
                      <span
                        className={
                          "font-normal text-[1.3rem] leading-8 text-neutral-600"
                        }
                      >
                        {organisation.followers.length} {t("followers")}
                      </span>
                    </div>
                  </Link>
                  <FollowButton
                    organisationId={event.organisationId}
                    initialIsFollowing={isFollowing.length > 0}
                  />
                </div>
                <ul className="flex flex-col w-full">
                  {event.eventDays.map((eventDate) => {
                    return (
                      <li key={eventDate.eventDayId} className="flex flex-col gap-6">
                        {/*  date*/}
                        <div className={"flex items-center gap-2"}>
                          <div
                            className={
                              "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                            }
                          >
                            <Calendar2
                              size="20"
                              color="#737c8a"
                              variant="Bulk"
                            />
                          </div>
                          <span
                            className={
                              "font-normal text-[1.4rem] leading-8 text-deep-200"
                            }
                          >
                            {formatDate(
                              eventDate.eventDate,
                              locale,
                              eventDate.timezone,
                            )}
                          </span>
                          {event.eventCategory !== "meet" && (
                            <AddToCalendar event={event} />
                          )}
                        </div>
                        {/*  time*/}
                        <div className={"flex items-center gap-2"}>
                          <div
                            className={
                              "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                            }
                          >
                            <Clock size="20" color="#737c8a" variant="Bulk" />
                          </div>
                          <span
                            className={
                              "font-normal text-[1.4rem] leading-8 text-deep-200"
                            }
                          >
                            {formatTime(
                              eventDate.startTime,
                              eventDate.timezone,
                              locale,
                            )}{" "}
                            -{" "}
                            {formatTime(
                              eventDate.endTime,
                              eventDate.timezone,
                              locale,
                            )}{" "}
                            - {eventDate.timezone}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {/*  address*/}
                {event.eventCategory === "meet" && (
                  <div className={"flex items-center gap-2 "}>
                    <div
                      className={
                        "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                      }
                    >
                      <Google size="20" color="#737c8a" variant="Bulk" />
                    </div>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]"
                      }
                    >
                      Meet, Google
                    </span>
                  </div>
                )}
                {event.eventCategory !== "meet" && (
                  <div className={"flex items-center gap-2 "}>
                    <div
                      className={
                        "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                      }
                    >
                      <Location size="20" color="#737c8a" variant="Bulk" />
                    </div>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]"
                      }
                    >
                      {event.address}, {event.city}, {Capitalize(event.state)},{" "}
                      {event.country}
                    </span>
                  </div>
                )}
              </div>
              {event.eventCategory !== "meet" && (
                <>
                  <Separator />
                  <div className=" flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          "font-semibold text-[1.6rem] leading-8 text-deep-200"
                        }
                      >
                        {t("direction")}
                      </span>

                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}`}
                        target="_blank"
                        className="flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
                      >
                        {t("open")}{" "}
                        <RouteSquare variant="Bulk" color="#E45B00" size={20} />
                      </Link>
                    </div>
                    <Map location={event.location} />
                    <div></div>
                  </div>
                </>
              )}
            </div>
            <div></div>
          </div>

          <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-8 p-4 pt-0">
            <div className={"flex flex-col gap-8"}>
              <span
                className={
                  "font-semibold text-[1.6rem] leading-8 text-deep-200"
                }
              >
                {t("details")}
              </span>
              {/*  organizer*/}
              <div className={"flex items-center justify-between w-full"}>
                <Link
                  href={`/organisations/${organisation.organisationId}`}
                  className={"flex items-center gap-4"}
                >
                  {organisation?.profileImageUrl ? (
                    <Image
                      src={organisation.profileImageUrl}
                      width={35}
                      height={35}
                      alt={organisation.organisationName}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                      {organisation?.organisationName.slice()[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className={"flex flex-col"}>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200"
                      }
                    >
                      {organisation.organisationName}{" "}
                      {organisation.isVerified && (
                        <VerifiedOrganisationCheckMark />
                      )}
                    </span>
                    <span
                      className={
                        "font-normal text-[1.3rem] leading-8 text-neutral-600"
                      }
                    >
                      {organisation.followers.length} {t("followers")}
                    </span>
                  </div>
                </Link>
                <FollowButton
                  organisationId={event.organisationId}
                  initialIsFollowing={isFollowing.length > 0}
                />
              </div>
              <ul className="flex flex-col gap-8">
                {event.eventDays.map((eventDate) => {
                  return (
                    <li
                      key={eventDate.eventDayId}
                      className="flex flex-col w-full gap-2"
                    >
                      {/*  date*/}
                      <div className={"flex items-center gap-2"}>
                        <div
                          className={
                            "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                          }
                        >
                          <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                        </div>
                        <span
                          className={
                            "font-normal text-[1.4rem] leading-8 text-deep-200"
                          }
                        >
                          {formatDate(
                            eventDate.eventDate,
                            locale,
                            eventDate.timezone,
                          )}
                        </span>
                        {event.eventCategory !== "meet" && (
                          <AddToCalendar event={event} />
                        )}
                      </div>
                      {/*  time*/}
                      <div className={"flex items-center gap-2"}>
                        <div
                          className={
                            "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                          }
                        >
                          <Clock size="20" color="#737c8a" variant="Bulk" />
                        </div>
                        <span
                          className={
                            "font-normal text-[1.4rem] leading-8 text-deep-200"
                          }
                        >
                          {formatTime(
                            eventDate.startTime,
                            eventDate.timezone,
                            locale,
                          )}{" "}
                          -{" "}
                          {formatTime(
                            eventDate.endTime,
                            eventDate.timezone,
                            locale,
                          )}{" "}
                          - {eventDate.timezone}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {/*  address*/}
              {event.eventCategory === "meet" && (
                <div className={"flex items-center gap-2 "}>
                  <div
                    className={
                      "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                    }
                  >
                    <Google size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span
                    className={
                      "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]"
                    }
                  >
                    Meet, Google
                  </span>
                </div>
              )}
              {event.eventCategory !== "meet" && (
                <div className={"flex items-center gap-2 "}>
                  <div
                    className={
                      "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                    }
                  >
                    <Location size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span
                    className={
                      "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]"
                    }
                  >
                    {event.address}, {event.city}, {Capitalize(event.state)},{" "}
                    {event.country}
                  </span>
                </div>
              )}
            </div>
            {event.eventCategory !== "meet" && (
              <>
                <Separator />
                <div className=" flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        "font-semibold text-[1.6rem] leading-8 text-deep-200"
                      }
                    >
                      {t("direction")}
                    </span>

                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}`}
                      target="_blank"
                      className="flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
                    >
                      {t("open")}{" "}
                      <RouteSquare variant="Bulk" color="#E45B00" size={20} />
                    </Link>
                  </div>
                  <Map location={event.location} />
                  <div></div>
                </div>
              </>
            )}
          </div>
        </main>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}
