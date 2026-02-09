"use client";
import { UpdateUserPreferences } from "@/actions/userActions";
import PageLoader from "@/components/PageLoader";
import Separator from "@/components/shared/Separator";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { UserPreference } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

export default function EmailNotifications({
  userPreferences,
}: {
  userPreferences: UserPreference;
}) {
  const t = useTranslations("Preferences");
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();

  async function updatePreferences(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const upcomingEvents = formData.get("upcomingEvents") === "on";
    const newEventsPreferredCategories =
      formData.get("newEventsPreferredCategories") === "on";
    const newEventsFollowedOrganizer =
      formData.get("newEventsFollowedOrganizer") === "on";

    const body = {
      upcomingEvents,
      newEventsPreferredCategories,
      newEventsFollowedOrganizer,
    };

    const response = await UpdateUserPreferences(
      session?.user.accessToken ?? "",
      {
        ...body,
        currency: userPreferences.currency,
        notifications: userPreferences.notifications,
      },
      locale,
    );
    if (response.status === "failed") {
      toast.error(response.message);
    }
    setIsLoading(false);
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
      <form onChange={updatePreferences} className="flex flex-col gap-6">
        <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
          {t("email.title")}
        </span>
        <div className={"flex items-center justify-between"}>
          <p
            className={
              "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
            }
          >
            {t("email.upcoming")}
          </p>
          <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500">
            <input
              className="peer sr-only"
              id="upcomingEvents"
              defaultChecked={userPreferences.upcomingEvents}
              name={"upcomingEvents"}
              type="checkbox"
            />
            <ToggleIcon />
          </label>
        </div>
        <Separator />
        <div className={"flex items-center justify-between"}>
          <p
            className={
              "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
            }
          >
            {t("email.preferred")}
          </p>
          <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500">
            <input
              className="peer sr-only"
              id="newEventsPreferredCategories"
              defaultChecked={userPreferences.newEventsPreferredCategories}
              name={"newEventsPreferredCategories"}
              type="checkbox"
            />
            <ToggleIcon />
          </label>
        </div>
        <Separator />
        <div className={"flex items-center justify-between"}>
          <p
            className={
              "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
            }
          >
            {t("email.follow")}
          </p>
          <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500">
            <input
              className="peer sr-only"
              id="newEventsFollowedOrganizer"
              defaultChecked={userPreferences.newEventsFollowedOrganizer}
              name={"newEventsFollowedOrganizer"}
              type="checkbox"
            />
            <ToggleIcon />
          </label>
        </div>
      </form>
    </>
  );
}
