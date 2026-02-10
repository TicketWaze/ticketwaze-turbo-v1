"use client";
import { UpdateOrganisationNotificationPreferences } from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { NotificationPreference } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { toast } from "sonner";

export default function NotificationForm({
  notificationPreferences,
  authorized,
}: {
  notificationPreferences: NotificationPreference;
  authorized: boolean;
}) {
  const t = useTranslations("Settings.notification");
  const locale = useLocale();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const organisation = session?.activeOrganisation;
  async function changeHandler(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const emailTicketSalesUpdate =
      formData.get("emailTicketSalesUpdate") === "on";
    const emailPaymentUpdates = formData.get("emailPaymentUpdates") === "on";
    const emailPlatformAnnouncements =
      formData.get("emailPlatformAnnouncements") === "on";

    const body = {
      emailTicketSalesUpdate,
      emailPaymentUpdates,
      emailPlatformAnnouncements,
    };

    const result = await UpdateOrganisationNotificationPreferences(
      organisation?.organisationId ?? "",
      body,
      session?.user.accessToken ?? "",
      locale,
    );

    if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  }
  return (
    <div
      className={
        "flex flex-col overflow-y-scroll gap-16 w-full h-[70dvh] lg:w-212 mx-auto"
      }
    >
      <PageLoader isLoading={isLoading} />
      <form onChange={changeHandler} className={"flex flex-col gap-8"}>
        <span
          className={"font-medium text-[1.8rem] pb-4 leading-10 text-deep-100"}
        >
          {t("email")}
        </span>
        <div className={"flex items-center justify-between"}>
          <p
            className={
              "text-[1.6rem] leading-[2.2rem] text-deep-100 max-w-md lg:max-w-152"
            }
          >
            {t("ticket_sales")}
          </p>
          <label
            className={`relative inline-block h-12 w-20 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 ${authorized ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            <input
              className="peer sr-only"
              id="emailTicketSalesUpdate"
              defaultChecked={notificationPreferences.emailTicketSalesUpdate}
              name={"emailTicketSalesUpdate"}
              type="checkbox"
              disabled={!authorized}
            />
            <ToggleIcon />
          </label>
        </div>
        <div className={"h-[.1rem] w-full bg-neutral-100"}></div>
        <div className={"flex items-center justify-between"}>
          <p
            className={
              "text-[1.6rem] leading-[2.2rem] text-deep-100 max-w-md lg:max-w-152"
            }
          >
            {t("payment_update")}
          </p>
          <label
            className={`relative inline-block h-12 w-20 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 ${authorized ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            <input
              className="peer sr-only"
              id="emailPaymentUpdates"
              defaultChecked={notificationPreferences.emailPaymentUpdates}
              name={"emailPaymentUpdates"}
              type="checkbox"
              disabled={!authorized}
            />
            <ToggleIcon />
          </label>
        </div>
        <div className={"h-[.1rem] w-full bg-neutral-100"}></div>
        <div className={"flex items-center justify-between"}>
          <p
            className={
              "text-[1.6rem] leading-[2.2rem] text-deep-100 max-w-md lg:max-w-152"
            }
          >
            {t("platform")}
          </p>
          <label
            className={`relative inline-block h-12 w-20 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 ${authorized ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            <input
              className="peer sr-only"
              id="emailPlatformAnnouncements"
              defaultChecked={
                notificationPreferences.emailPlatformAnnouncements
              }
              name={"emailPlatformAnnouncements"}
              type="checkbox"
              disabled={!authorized}
            />
            <ToggleIcon />
          </label>
        </div>
      </form>
    </div>
  );
}
