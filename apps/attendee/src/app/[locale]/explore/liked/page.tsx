import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import BackButton from "@/components/shared/BackButton";
import EventCard from "@/components/shared/EventCard";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import Slugify from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import { Heart } from "iconsax-reactjs";
import { getLocale, getTranslations } from "next-intl/server";

export default async function LikedPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/auth/login", locale });
  }
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/favorites`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const response = await request.json();
  const events: Event[] = response.events;
  const t = await getTranslations("Liked");
  return (
    <AttendeeLayout title="">
      <BackButton text={t("back")} />
      <div className="flex flex-col gap-[5px]">
        <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black">
          {t("title")}
        </span>
      </div>
      <ul className="list pt-4">
        {events.map((event) => {
          const slug = Slugify(event.eventName);
          return (
            <li key={event.eventId}>
              <EventCard
                // href={`/explore/${slug}`}
                event={event}
              />
            </li>
          );
        })}
      </ul>
      {events.length === 0 && (
        <div
          className={
            "w-[330px] lg:w-[460px] mx-auto h-full justify-center flex flex-col items-center gap-[5rem]"
          }
        >
          <div
            className={
              "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
            }
          >
            <div
              className={
                "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
              }
            >
              <Heart size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <div className={"flex flex-col gap-[3rem] items-center text-center"}>
            <p
              className={
                "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
              }
            >
              {t("noEvent")}
            </p>
          </div>
        </div>
      )}
    </AttendeeLayout>
  );
}
